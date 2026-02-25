import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Edit,
  Trash2,
  Search,
  Eye,
  ImageIcon,
  Loader,
  Info,
  EyeOff,
  X,
  Upload,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import Pagination from "../../components/Pagination";
import Authorized from "@/app/components/Authorized";
import { toast } from "react-toastify";
import Link from "next/link";

const ViewProducts = ({ onEditProduct, onViewProduct, onDeleteProduct }) => {
  const token = localStorage.getItem("staffUserToken");
  const getAuthHeaders = () => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("staffUserToken")
        : null;

    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  // Image viewing states
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedProductImages, setSelectedProductImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const selectAllRef = useRef(null);

  const fileInputRef = useRef(null);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [importingExcel, setImportingExcel] = useState(false);

  const searchTimeoutRef = useRef(null);
  const categories = [
    "Dresses",
    "Tops",
    "Bottoms",
    "Accessories",
    "Shoes",
    "Outerwear",
    "Activewear",
    "Swimwear",
  ];
  const API_BASE = process.env.NEXT_PUBLIC_API_URL;

  const currentPageIds = useMemo(() => products.map((b) => b.id), [products]);

  const selectedOnPageCount = useMemo(
    () => products.filter((b) => selectedProductIds.includes(b.id)).length,
    [products, selectedProductIds],
  );

  const allOnPageSelected =
    products.length > 0 && selectedOnPageCount === products.length;

  // Image utility functions
  const getImageSrc = (
    imageSrc,
    fallback = "https://placehold.co/400x400/FFB6C1/FFFFFF?text=Pink+Dreams",
  ) => {
    if (!imageSrc) return fallback;

    const baseURL = API_BASE || "http://localhost:4000";

    // Handle old Railway URLs
    if (imageSrc.includes("railway.app")) {
      const filename = imageSrc.split("/images/")[1];
      if (filename) {
        return `${baseURL}/images/${filename}`;
      }
    }

    if (imageSrc.startsWith("http://") || imageSrc.startsWith("https://")) {
      return imageSrc;
    }

    if (imageSrc.startsWith("/images/")) {
      return `${baseURL}${imageSrc}`;
    }

    if (
      !imageSrc.includes("/") &&
      /\.(jpg|jpeg|png|gif|webp)$/i.test(imageSrc)
    ) {
      return `${baseURL}/images/${imageSrc}`;
    }

    if (imageSrc.startsWith("images/")) {
      return `${baseURL}/${imageSrc}`;
    }

    return `${baseURL}/${imageSrc}`;
  };

  const handleImageError = (e) => {
    if (
      e.target.src !==
      "https://placehold.co/400x400/FFB6C1/FFFFFF?text=No+Image"
    ) {
      e.target.onerror = null;
      e.target.src = "https://placehold.co/400x400/FFB6C1/FFFFFF?text=No+Image";
    }
  };

  // Handle multiple images display
  const handleViewImages = (product) => {
    let images = [];

    if (product.images && Array.isArray(product.images)) {
      images = product.images;
    } else if (product.image) {
      images = [product.image];
    }

    images = images
      .filter((img) => img && img.trim() !== "")
      .map((img) => getImageSrc(img));

    if (images.length > 0) {
      setSelectedProductImages(images);
      setCurrentImageIndex(0);
      setShowImageModal(true);
    }
  };

  // Handle toggle active status
  const handleToggleActive = async (productId) => {
    try {
      const response = await fetch(
        `${API_BASE}/product/${productId}/toggle-active`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (data.success) {
        fetchProducts();
      } else {
        alert(data.message || "Failed to toggle product status");
      }
    } catch (error) {
      console.error("Error toggling product status:", error);
      alert("Failed to toggle product status");
    }
  };

  // Image Modal Component
  const ImageModal = () => {
    if (!showImageModal || selectedProductImages.length === 0) return null;

    const nextImage = () => {
      setCurrentImageIndex((prev) =>
        prev === selectedProductImages.length - 1 ? 0 : prev + 1,
      );
    };

    const prevImage = () => {
      setCurrentImageIndex((prev) =>
        prev === 0 ? selectedProductImages.length - 1 : prev - 1,
      );
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-semibold">
              Product Images ({currentImageIndex + 1} of{" "}
              {selectedProductImages.length})
            </h3>
            <button
              onClick={() => setShowImageModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="relative">
            <img
              src={selectedProductImages[currentImageIndex]}
              alt={`Product image ${currentImageIndex + 1}`}
              className="w-full h-96 object-contain bg-gray-50"
              onError={handleImageError}
            />

            {selectedProductImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </>
            )}
          </div>

          {selectedProductImages.length > 1 && (
            <div className="p-4 border-t">
              <div className="flex gap-2 justify-center overflow-x-auto">
                {selectedProductImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex
                        ? "border-blue-500"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Product Image Display Component
  const ProductImageDisplay = ({ product }) => {
    let images = [];

    if (product.images && Array.isArray(product.images)) {
      images = product.images.filter((img) => img && img.trim() !== "");
    } else if (product.image) {
      images = [product.image];
    }

    if (images.length === 0) {
      return (
        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center mr-3">
          <ImageIcon className="w-5 h-5 text-gray-400" />
        </div>
      );
    }

    return (
      <div className="flex items-center mr-3">
        <div className="relative">
          <img
            src={getImageSrc(product?.image)}
            alt={product.name}
            className="w-10 h-10 rounded object-cover cursor-pointer hover:opacity-80 transition-opacity"
            onError={handleImageError}
          />
        </div>
      </div>
    );
  };

  // Fetch products function
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        category: selectedCategory,
        minPrice: priceRange.min || "0",
        maxPrice: priceRange.max || Number.MAX_VALUE.toString(),
        sortBy: sortBy,
        sortOrder: sortOrder,
      });

      const response = await fetch(`${API_BASE}/allproducts?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setProducts(data.products || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalItems(data.pagination?.totalProducts || 0);
      } else {
        setProducts([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  // Handle search with proper debouncing
  const handleSearchChange = (value) => {
    setSearchTerm(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchProducts();
    }, 500);
  };

  const handleDeleteProduct = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        const response = await fetch(`${API_BASE}/removeproduct`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ id, name }),
        });

        const data = await response.json();
        if (data.success) {
          fetchProducts();
          if (onDeleteProduct) {
            onDeleteProduct({ id, name });
          }
        }
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProductIds.length === 0) return;

    const confirmed = window.confirm(
      `Delete ${selectedProductIds.length} selected products(s)? This action cannot be undone.`,
    );
    if (!confirmed) return;

    setBulkDeleting(true);
    try {
      const response = await fetch(`${API_BASE}/products/bulk-delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ ids: selectedProductIds }),
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.message || "Failed to bulk delete products");
        return;
      }

      setSelectedProductIds([]);
      await fetchProducts();

      // const extraInfo = [
      //   data.invalidIds?.length
      //     ? `Invalid IDs: ${data.invalidIds.length}`
      //     : null,
      //   data.notFoundIds?.length
      //     ? `Not found: ${data.notFoundIds.length}`
      //     : null,
      // ]
      //   .filter(Boolean)
      //   .join(" | ");

      // alert(
      //   extraInfo
      //     ? `${data.message}\n${extraInfo}`
      //     : data.message || "Bulk delete completed",
      // );
      toast.success(data.message || "Bulk delete completed");
    } catch (error) {
      console.error("Error bulk deleting products:", error);
      alert("Failed to bulk delete products");
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleSelectOne = (productId, checked) => {
    if (checked) {
      setSelectedProductIds((prev) =>
        Array.from(new Set([...prev, productId])),
      );
    } else {
      setSelectedProductIds((prev) => prev.filter((id) => id !== productId));
    }
  };

  const handleSelectAllCurrentPage = (checked) => {
    if (checked) {
      setSelectedProductIds((prev) =>
        Array.from(new Set([...prev, ...currentPageIds])),
      );
    } else {
      setSelectedProductIds((prev) =>
        prev.filter((id) => !currentPageIds.includes(id)),
      );
    }
  };

  const joinPipe = (value) =>
    Array.isArray(value) ? value.filter(Boolean).join(" | ") : "";

  const formatSpecsForExport = (specs) =>
    Array.isArray(specs)
      ? specs
          .map(
            (s) =>
              `${String(s?.key || "").trim()}:${String(s?.value || "").trim()}`,
          )
          .filter((x) => x !== ":")
          .join(" | ")
      : "";

  const exportProductsToExcel = async () => {
    if (!products.length) {
      toast.info("No products to export on this page.");
      return;
    }

    setExportingExcel(true);
    try {
      const XLSXModule = await import("xlsx");
      const XLSX = XLSXModule.default ?? XLSXModule;

      const rows = products.map((p) => {
        const oldPrice = Number(p.old_price || 0);
        const newPrice = Number(p.new_price || 0);
        const discountPercent =
          oldPrice > 0
            ? (((oldPrice - newPrice) / oldPrice) * 100).toFixed(2)
            : "0.00";

        return {
          "Product ID": p.id ?? "",
          Name: p.name ?? "",
          Category: p.category ?? "",
          Brand: p.brand ?? "",
          SKU: p.sku ?? "",
          Status: p.status ?? "published",
          Active: p.available ? "Yes" : "No",
          Featured: p.featured ? "Yes" : "No",
          "New Price": newPrice,
          "Old Price": oldPrice,
          "Discount %": Number(discountPercent),
          "Stock Quantity": Number(p.stock_quantity || 0),
          "Low Stock Threshold": Number(p.low_stock_threshold || 0),
          "Shipping Class": p.shipping_class ?? "standard",
          "Primary Image": p.image ?? "",
          "Images (| separated)": joinPipe(p.images),
          "Colors (| separated)": joinPipe(p.colors),
          "Sizes (| separated)": joinPipe(p.sizes),
          "Tags (| separated)": joinPipe(p.tags),
          "Features (| separated)": joinPipe(p.features),
          "Specifications (key:value|...)": formatSpecsForExport(
            p.specifications,
          ),
          Description: p.description ?? "",
          "Short Description": p.short_description ?? "",
          "Created At": p.createdAt ? new Date(p.createdAt).toISOString() : "",
          "Updated At": p.updatedAt ? new Date(p.updatedAt).toISOString() : "",
        };
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      const headers = Object.keys(rows[0] || {});
      ws["!cols"] = headers.map((h) => ({
        wch: Math.min(Math.max(h.length + 2, 14), 45),
      }));
      if (ws["!ref"]) ws["!autofilter"] = { ref: ws["!ref"] };

      const info = XLSX.utils.aoa_to_sheet([
        ["Export", "Products - Current Visible Page"],
        ["Generated At", new Date().toLocaleString()],
        ["Search", searchTerm || "All"],
        ["Category", selectedCategory || "All"],
        ["Min Price", priceRange.min || "Any"],
        ["Max Price", priceRange.max || "Any"],
        ["Sort", `${sortBy} (${sortOrder})`],
        ["Current Page", `${currentPage}`],
        ["Items Per Page", `${itemsPerPage}`],
        ["Rows Exported", `${products.length}`],
      ]);
      info["!cols"] = [{ wch: 24 }, { wch: 50 }];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Products");
      XLSX.utils.book_append_sheet(wb, info, "Export_Info");

      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      XLSX.writeFile(wb, `products-current-page-${currentPage}-${stamp}.xlsx`);
      toast.success(`Exported ${products.length} product(s).`);
    } catch (error) {
      console.error("Error exporting products:", error);
      toast.error("Failed to export products.");
    } finally {
      setExportingExcel(false);
    }
  };

  const downloadImportTemplate = async () => {
    try {
      const XLSXModule = await import("xlsx");
      const XLSX = XLSXModule.default ?? XLSXModule;

      const headers = [
        "name",
        "category",
        "new_price",
        "old_price",
        "image",
        "images",
        "brand",
        "sku",
        "stock_quantity",
        "low_stock_threshold",
        "available",
        "featured",
        "status",
        "description",
        "short_description",
        "colors",
        "sizes",
        "tags",
        "features",
        "shipping_class",
        "weight",
        "dimension_length",
        "dimension_width",
        "dimension_height",
        "discount_type",
        "discount_value",
        "sale_start_date",
        "sale_end_date",
        "meta_title",
        "meta_description",
        "meta_keywords",
        "slug",
        "materials",
        "care_instructions",
        "size_chart",
        "specifications",
        "related_products",
      ];

      const sample = {
        name: "Sample Floral Dress",
        category: "Dresses",
        new_price: 49.99,
        old_price: 69.99,
        image: "https://example.com/images/floral-dress-main.jpg",
        images:
          "https://example.com/images/floral-dress-main.jpg|https://example.com/images/floral-dress-side.jpg",
        brand: "Pink Dreams",
        sku: "DRS-1001",
        stock_quantity: 30,
        low_stock_threshold: 5,
        available: "true",
        featured: "false",
        status: "published",
        description: "Long floral dress with soft fabric and elegant cut.",
        short_description: "Floral maxi dress",
        colors: "Pink|White",
        sizes: "S|M|L",
        tags: "summer|floral|maxi",
        features: "Breathable|Lightweight",
        shipping_class: "standard",
        weight: 0.65,
        dimension_length: 28,
        dimension_width: 22,
        dimension_height: 3,
        discount_type: "percentage",
        discount_value: 0,
        sale_start_date: "2026-03-01",
        sale_end_date: "2026-03-30",
        meta_title: "Sample Floral Dress - Pink Dreams",
        meta_description: "A trendy floral dress for summer.",
        meta_keywords: "dress,floral,summer",
        slug: "sample-floral-dress",
        materials: "Cotton Blend",
        care_instructions: "Machine wash cold",
        size_chart: "https://example.com/size-chart/dress",
        specifications: "Fit:Regular|Sleeve:Sleeveless",
        related_products: "1002|1003",
      };

      const templateSheet = XLSX.utils.json_to_sheet([sample], {
        header: headers,
      });
      templateSheet["!cols"] = headers.map((h) => ({
        wch: Math.min(Math.max(h.length + 2, 18), 45),
      }));
      if (templateSheet["!ref"])
        templateSheet["!autofilter"] = { ref: templateSheet["!ref"] };

      const instructionsSheet = XLSX.utils.aoa_to_sheet([
        [
          "═══════════════════════════════════════════════════════════════════════════════════",
        ],
        [
          "                        PRODUCT IMPORT INSTRUCTIONS                                  ",
        ],
        [
          "═══════════════════════════════════════════════════════════════════════════════════",
        ],
        [""],
        ["📋 REQUIRED FIELDS (Must have at least these):"],
        ["  • name         - Product title (e.g., 'Pink Floral Dress')"],
        [
          "  • category     - Must match an existing category (e.g., 'Dresses', 'Tops')",
        ],
        ["  • new_price    - Current selling price (numeric, e.g., 49.99)"],
        ["  • image        - Primary image URL (at least one image required)"],
        [""],
        ["🖼️ IMAGE GUIDELINES:(Only cloudinary urls are accepted.)"],
        [
          "  • PRIMARY IMAGE (image): Use a direct URL to your main product photo",
        ],
        ["    Example: https://cloudinary.com/images/dress-main.jpg"],
        [""],
        [
          "  • ADDITIONAL IMAGES (images): Separate multiple URLs with | pipe character",
        ],
        [
          "    Example: https://cloudinary.com/img1.jpg|https://cloudinary.com/img2.jpg|https://cloudinary.com/img3.jpg",
        ],
        [
          "    💡 Tip: Add up to 5-10 images for best presentation. First image is the main one.",
        ],
        [""],
        ["📦 MULTI-VALUE FIELDS (use | separator between values):"],
        ["  • colors       - Available colors (e.g., Pink|White|Blue|Navy)"],
        ["  • sizes        - Available sizes (e.g., S|M|L|XL|XXL)"],
        ["  • tags         - Search tags (e.g., summer|floral|casual|elegant)"],
        [
          "  • features     - Product features (e.g., Breathable|Lightweight|Stretchable)",
        ],
        [""],
        ["📝 SPECIFICATIONS FORMAT:"],
        ["  Use key:value format, separated by | pipe character"],
        [
          "  Example: Fit:Regular|Sleeve:Sleeveless|Length:Maxi|Fabric:Cotton Blend",
        ],
        [
          "  💡 Common specs: Fit, Sleeve, Length, Fabric, Pattern, Neckline, Waistline",
        ],
        [""],
        ["🏷️ PRODUCT STATUS OPTIONS:"],
        ["  • published   - Visible on website (default)"],
        ["  • draft        - Saved but not visible"],
        ["  • archived     - Hidden from store"],
        [""],
        ["🚚 SHIPPING CLASS OPTIONS:"],
        ["  • standard    - Regular shipping (default)"],
        ["  • express     - Faster delivery"],
        ["  • overnight   - Next day delivery"],
        ["  • free        - Free shipping"],
        [""],
        ["💰 PRICING & DISCOUNTS:"],
        ["  • new_price       - Current selling price (required)"],
        ["  • old_price      - Original price (for showing discount)"],
        ["  • discount_type   - 'percentage' or 'fixed'"],
        ["  • discount_value  - Discount amount (e.g., 20 for 20% or $20)"],
        ["  • sale_start_date - Promotion start (YYYY-MM-DD format)"],
        ["  • sale_end_date   - Promotion end (YYYY-MM-DD format)"],
        [""],
        ["DIMENSIONS & WEIGHT:"],
        ["  • weight            - Package weight in kg"],
        ["  • dimension_length  - Length in inches"],
        ["  • dimension_width   - Width in inches"],
        ["  • dimension_height  - Height in inches"],
        [""],
        ["🔗 RELATED PRODUCTS:"],
        ["  Use product IDs separated by | (e.g., 1001|1002|1003)"],
        ["  💡 Find product IDs from your existing products list"],
        [""],
        ["✅ BOOLEAN VALUES (true/false):"],
        ["  • available     - Product in stock (true/false)"],
        ["  • featured     - Show on homepage (true/false)"],
        ["  Accepts: true, false, yes, no, 1, 0"],
        [""],
        ["📅 DATE FORMAT:"],
        ["  Use YYYY-MM-DD format (e.g., 2026-03-15)"],
        [""],
        ["🔍 SEO FIELDS (Optional but recommended):"],
        ["  • meta_title       - Browser title (50-60 chars)"],
        ["  • meta_description - Search description (150-160 chars)"],
        ["  • meta_keywords    - Comma or | separated keywords"],
        ["  • slug             - URL-friendly name (e.g., pink-floral-dress)"],
        [""],
        ["📝 OTHER OPTIONAL FIELDS:"],
        ["  • brand           - Product brand"],
        ["  • sku             - Stock keeping unit (unique identifier)"],
        ["  • stock_quantity  - Number of items in stock"],
        ["  • low_stock_threshold - Alert when stock runs low"],
        ["  • short_description - Brief product summary"],
        ["  • description     - Full product details (supports HTML)"],
        ["  • materials       - What product is made of"],
        ["  • care_instructions - How to maintain product"],
        ["  • size_chart      - URL to size chart image"],
        [""],
        [
          "═══════════════════════════════════════════════════════════════════════════════════",
        ],
        [
          "                                    TIPS                                            ",
        ],
        [
          "═══════════════════════════════════════════════════════════════════════════════════",
        ],
        [
          "  💡 Start with the Template sheet - it's pre-filled with example data",
        ],
        ["  💡 Keep one product per row"],
        ["  💡 Use consistent category names that already exist in your store"],
        ["  💡 Test import with a few products first before bulk importing"],
        [
          " 💡 Only cloudinary images URL are allowed , so first upload images on cloudinary and get their URL's and then add in file",
        ],
        ["  💡 For best results, resize images to 800x1000px or similar ratio"],
        [""],
        [
          "Need help? Check your existing products for reference or contact support.",
        ],
      ]);
      instructionsSheet["!cols"] = [{ wch: 28 }, { wch: 100 }];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, templateSheet, "Template");
      XLSX.utils.book_append_sheet(wb, instructionsSheet, "Instructions");

      XLSX.writeFile(wb, "products-import-template.xlsx");
      toast.success("Import template downloaded.");
    } catch (error) {
      console.error("Error creating template:", error);
      toast.error("Failed to download template.");
    }
  };

  const downloadImportErrorReport = (errors = []) => {
    if (!errors.length) return;
    const lines = [
      "row,reason",
      ...errors.map(
        (e) => `${e.row},"${String(e.reason).replace(/"/g, '""')}"`,
      ),
    ];
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `product-import-errors-${new Date().toISOString().replace(/[:.]/g, "-")}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const allowed = [".xlsx", ".xls", ".csv"];
    const lower = file.name.toLowerCase();
    const isAllowed = allowed.some((ext) => lower.endsWith(ext));
    if (!isAllowed) {
      toast.error("Please upload a valid Excel/CSV file.");
      return;
    }

    setImportingExcel(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE}/products/import-excel`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
        },
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.message || "Import failed.");
        return;
      }

      toast.success(data.message || "Products imported successfully.");

      if (
        data.summary?.failed > 0 &&
        Array.isArray(data.errors) &&
        data.errors.length
      ) {
        toast.warn(
          `${data.summary.failed} row(s) skipped. Error report downloaded.`,
        );
        downloadImportErrorReport(data.errors);
      }

      setCurrentPage(1);
      fetchProducts();
    } catch (error) {
      console.error("Error importing products:", error);
      toast.error("Failed to import products.");
    } finally {
      setImportingExcel(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [
    currentPage,
    selectedCategory,
    priceRange.min,
    priceRange.max,
    sortBy,
    sortOrder,
    itemsPerPage,
  ]);

  useEffect(() => {
    if (!selectAllRef.current) return;
    selectAllRef.current.indeterminate =
      selectedOnPageCount > 0 && !allOnPageSelected;
  }, [selectedOnPageCount, allOnPageSelected]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="All">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min Price"
              value={priceRange.min}
              onChange={(e) => {
                setPriceRange((prev) => ({ ...prev, min: e.target.value }));
                setCurrentPage(1);
              }}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="number"
              placeholder="Max Price"
              value={priceRange.max}
              onChange={(e) => {
                setPriceRange((prev) => ({ ...prev, max: e.target.value }));
                setCurrentPage(1);
              }}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split("-");
              setSortBy(field);
              setSortOrder(order);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="new_price-asc">Price Low-High</option>
            <option value="new_price-desc">Price High-Low</option>
          </select>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-700">Bulk Tools</p>
            <p className="text-xs text-gray-500">
              Export visible products, download starter template, and import
              products in bulk from Excel.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Authorized permission="products:read">
              <button
                onClick={exportProductsToExcel}
                disabled={loading || exportingExcel || products.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                title="Export currently visible products to Excel"
              >
                {exportingExcel ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4" />
                )}
                {exportingExcel ? "Exporting..." : "Export Excel"}
              </button>
            </Authorized>

            <Authorized permission="products:create">
              <button
                onClick={downloadImportTemplate}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                title="Download import template"
              >
                <Download className="w-4 h-4" />
                Download Template
              </button>
            </Authorized>

            <Authorized permission="products:create">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importingExcel}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                title="Import products from Excel file"
              >
                {importingExcel ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {importingExcel ? "Importing..." : "Import Excel"}
              </button>
            </Authorized>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleImportFile}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {selectedProductIds.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-center justify-between">
          <p className="text-sm font-medium text-rose-900">
            {selectedProductIds.length} product(s) selected
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedProductIds([])}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-white"
            >
              <X className="w-4 h-4" />
              Clear
            </button>

            <Authorized permission="products:delete">
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-60"
              >
                {bulkDeleting ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete Selected
              </button>
            </Authorized>
          </div>
        </div>
      )}

      {/* Search Results Info */}
      {searchTerm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            {loading ? "Searching..." : `Searching for "${searchTerm}"...`}
          </p>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={(e) =>
                      handleSelectAllCurrentPage(e.target.checked)
                    }
                    disabled={loading || products.length === 0}
                    className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Images
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    <div className="flex items-center justify-center">
                      <Loader className="w-6 h-6 animate-spin mr-2" />
                      Loading products...
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    {searchTerm
                      ? `No products found for "${searchTerm}"`
                      : "No products found"}
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  // Calculate number of images
                  let imageCount = 0;
                  if (product.images && Array.isArray(product.images)) {
                    imageCount = product.images.filter(
                      (img) => img && img.trim() !== "",
                    ).length;
                  } else if (product.image) {
                    imageCount = 1;
                  }

                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(product.id)}
                          onChange={(e) =>
                            handleSelectOne(product.id, e.target.checked)
                          }
                          className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <ProductImageDisplay product={product} />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {product.id}
                            </div>
                            {product.brand && (
                              <div className="text-xs text-gray-400">
                                {product.brand}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleViewImages(product)}
                          className="flex items-center gap-2 px-3 py-1 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 transition-colors"
                          disabled={imageCount === 0}
                        >
                          <Eye className="w-4 h-4" />
                          <span className="text-sm">
                            {imageCount > 0
                              ? `View ${imageCount} Image${imageCount > 1 ? "s" : ""}`
                              : "No Images"}
                          </span>
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-pink-50 text-pink-600 rounded-full">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          ${product.new_price}
                        </div>
                        {product.old_price &&
                          product.old_price !== product.new_price && (
                            <div className="text-sm text-gray-500 line-through">
                              ${product.old_price}
                            </div>
                          )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Authorized permission={"products:update"}>
                          <button
                            onClick={() => handleToggleActive(product._id)}
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all ${
                              product.available
                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                : "bg-red-100 text-red-800 hover:bg-red-200"
                            }`}
                          >
                            {product.available ? (
                              <>
                                <Eye className="w-3 h-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </button>
                        </Authorized>
                        {product.featured && (
                          <span className="ml-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                            Featured
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <Link
                            href={`/product/${product?.id}`}
                            className="text-green-600 hover:text-green-900 transition-colors"
                            title="View Details"
                          >
                            <Info className="w-4 h-4" />
                          </Link>
                          <Authorized permission="products:update">
                            {onEditProduct && (
                              <button
                                onClick={() => onEditProduct(product)}
                                className="text-blue-600 hover:text-blue-900 transition-colors"
                                title="Edit Product"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                          </Authorized>
                          <Authorized permission="products:delete">
                            <button
                              onClick={() =>
                                handleDeleteProduct(product.id, product.name)
                              }
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </Authorized>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={(page) => setCurrentPage(page)}
        onItemsPerPageChange={(perPage) => {
          setItemsPerPage(perPage);
          setCurrentPage(1); // Reset to first page when changing items per page
        }}
        itemsPerPageOptions={[10, 20, 50, 100]}
      />

      <ImageModal />
    </div>
  );
};

export default ViewProducts;
