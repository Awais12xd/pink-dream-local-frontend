"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Edit,
  Trash2,
  Search,
  Eye,
  ImageIcon,
  Loader,
  Info,
  EyeOff,
} from "lucide-react";
import Pagination from "@/app/components/Pagination";
import Blog from "@/app/blog/page";
import Image from "next/image";
import Authorized from "@/app/components/Authorized";

const ViewBlogs = ({ onEditBlog, onViewBlog, onDeleteBlog }) => {
  const token = localStorage.getItem("staffUserToken");

  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [blogCategories, setBlogCategories] = useState([]);

  // Image viewing states
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedProductImages, setSelectedProductImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  // Image utility functions
  //   const getImageSrc = (
  //     imageSrc,
  //     fallback = "https://placehold.co/400x400/FFB6C1/FFFFFF?text=Pink+Dreams",
  //   ) => {
  //     if (!imageSrc) return fallback;

  //     const baseURL = API_BASE || "http://localhost:4000";

  //     // Handle old Railway URLs
  //     if (imageSrc.includes("railway.app")) {
  //       const filename = imageSrc.split("/images/")[1];
  //       if (filename) {
  //         return `${baseURL}/images/${filename}`;
  //       }
  //     }

  //     if (imageSrc.startsWith("http://") || imageSrc.startsWith("https://")) {
  //       return imageSrc;
  //     }

  //     if (imageSrc.startsWith("/images/")) {
  //       return `${baseURL}${imageSrc}`;
  //     }

  //     if (
  //       !imageSrc.includes("/") &&
  //       /\.(jpg|jpeg|png|gif|webp)$/i.test(imageSrc)
  //     ) {
  //       return `${baseURL}/images/${imageSrc}`;
  //     }

  //     if (imageSrc.startsWith("images/")) {
  //       return `${baseURL}/${imageSrc}`;
  //     }

  //     return `${baseURL}/${imageSrc}`;
  //   };

  //   const handleImageError = (e) => {
  //     if (
  //       e.target.src !==
  //       "https://placehold.co/400x400/FFB6C1/FFFFFF?text=No+Image"
  //     ) {
  //       e.target.onerror = null;
  //       e.target.src = "https://placehold.co/400x400/FFB6C1/FFFFFF?text=No+Image";
  //     }
  //   };

  // Handle multiple images display
  //   const handleViewImages = (product) => {
  //     let images = [];

  //     if (product.images && Array.isArray(product.images)) {
  //       images = product.images;
  //     } else if (product.image) {
  //       images = [product.image];
  //     }

  //     images = images
  //       .filter((img) => img && img.trim() !== "")
  //       .map((img) => getImageSrc(img));

  //     if (images.length > 0) {
  //       setSelectedProductImages(images);
  //       setCurrentImageIndex(0);
  //       setShowImageModal(true);
  //     }
  //   };

  // Image Modal Component
  //   const ImageModal = () => {
  //     if (!showImageModal || selectedProductImages.length === 0) return null;

  //     const nextImage = () => {
  //       setCurrentImageIndex((prev) =>
  //         prev === selectedProductImages.length - 1 ? 0 : prev + 1,
  //       );
  //     };

  //     const prevImage = () => {
  //       setCurrentImageIndex((prev) =>
  //         prev === 0 ? selectedProductImages.length - 1 : prev - 1,
  //       );
  //     };

  //     return (
  //       <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
  //         <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden">
  //           <div className="flex justify-between items-center p-4 border-b">
  //             <h3 className="text-lg font-semibold">
  //               Product Images ({currentImageIndex + 1} of{" "}
  //               {selectedProductImages.length})
  //             </h3>
  //             <button
  //               onClick={() => setShowImageModal(false)}
  //               className="text-gray-500 hover:text-gray-700"
  //             >
  //               <svg
  //                 className="w-6 h-6"
  //                 fill="none"
  //                 stroke="currentColor"
  //                 viewBox="0 0 24 24"
  //               >
  //                 <path
  //                   strokeLinecap="round"
  //                   strokeLinejoin="round"
  //                   strokeWidth={2}
  //                   d="M6 18L18 6M6 6l12 12"
  //                 />
  //               </svg>
  //             </button>
  //           </div>

  //           <div className="relative">
  //             <img
  //               src={selectedProductImages[currentImageIndex]}
  //               alt={`Product image ${currentImageIndex + 1}`}
  //               className="w-full h-96 object-contain bg-gray-50"
  //               onError={handleImageError}
  //             />

  //             {selectedProductImages.length > 1 && (
  //               <>
  //                 <button
  //                   onClick={prevImage}
  //                   className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
  //                 >
  //                   <svg
  //                     className="w-6 h-6"
  //                     fill="none"
  //                     stroke="currentColor"
  //                     viewBox="0 0 24 24"
  //                   >
  //                     <path
  //                       strokeLinecap="round"
  //                       strokeLinejoin="round"
  //                       strokeWidth={2}
  //                       d="M15 19l-7-7 7-7"
  //                     />
  //                   </svg>
  //                 </button>
  //                 <button
  //                   onClick={nextImage}
  //                   className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
  //                 >
  //                   <svg
  //                     className="w-6 h-6"
  //                     fill="none"
  //                     stroke="currentColor"
  //                     viewBox="0 0 24 24"
  //                   >
  //                     <path
  //                       strokeLinecap="round"
  //                       strokeLinejoin="round"
  //                       strokeWidth={2}
  //                       d="M9 5l7 7-7 7"
  //                     />
  //                   </svg>
  //                 </button>
  //               </>
  //             )}
  //           </div>

  //           {selectedProductImages.length > 1 && (
  //             <div className="p-4 border-t">
  //               <div className="flex gap-2 justify-center overflow-x-auto">
  //                 {selectedProductImages.map((image, index) => (
  //                   <button
  //                     key={index}
  //                     onClick={() => setCurrentImageIndex(index)}
  //                     className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
  //                       index === currentImageIndex
  //                         ? "border-blue-500"
  //                         : "border-gray-200 hover:border-gray-300"
  //                     }`}
  //                   >
  //                     <img
  //                       src={image}
  //                       alt={`Thumbnail ${index + 1}`}
  //                       className="w-full h-full object-cover"
  //                       onError={handleImageError}
  //                     />
  //                   </button>
  //                 ))}
  //               </div>
  //             </div>
  //           )}
  //         </div>
  //       </div>
  //     );
  //   };

  // Product Image Display Component
  //   const ProductImageDisplay = ({ product }) => {
  //     let images = [];

  //     if (product.images && Array.isArray(product.images)) {
  //       images = product.images.filter((img) => img && img.trim() !== "");
  //     } else if (product.image) {
  //       images = [product.image];
  //     }

  //     if (images.length === 0) {
  //       return (
  //         <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center mr-3">
  //           <ImageIcon className="w-5 h-5 text-gray-400" />
  //         </div>
  //       );
  //     }

  //     return (
  //       <div className="flex items-center mr-3">
  //         <div className="relative">
  //           <img
  //             src={getImageSrc(images[0])}
  //             alt={product.name}
  //             className="w-10 h-10 rounded object-cover cursor-pointer hover:opacity-80 transition-opacity"
  //             onClick={() => handleViewImages(product)}
  //             onError={handleImageError}
  //           />
  //           {images.length > 1 && (
  //             <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
  //               {images.length}
  //             </span>
  //           )}
  //         </div>
  //       </div>
  //     );
  //   };

  // Fetch Blogs function
  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        category: selectedCategory,
        status: status,
        sortBy: sortBy,
        sortOrder: sortOrder,
        available : "all"
      });

      const response = await fetch(`${API_BASE}/all-blogs?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setBlogs(data.blogs || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalItems(data.pagination?.totalBlogs || 0);
      } else {
        setBlogs([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setBlogs([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };
  // fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await fetch(
          `${API_BASE}/blog-categories?active=true`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data = await response.json();

        if (
          data.success &&
          data.blogCategories &&
          data.blogCategories.length > 0
        ) {
          const sortedDynamicCategories = data.blogCategories?.sort((a, b) => {
            if (a.order !== b.order) return a.order - b.order;
            return a.name.localeCompare(b.name);
          });

          setBlogCategories(sortedDynamicCategories);
        } else {
          // If no dynamic categories, use only static categories
          console.warn(
            "No active categories found from backend, in view blogs",
          );
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        // On error, fallback to static categories
        console.log("Using static categories as fallback");
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [API_BASE]);

  // Handle search with proper debouncing
  const handleSearchChange = (value) => {
    setSearchTerm(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchBlogs();
    }, 500);
  };

  const handleDeleteProduct = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        const response = await fetch(`${API_BASE}/delete-blog/${id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title }),
        });
        const data = await response.json();
        if (data.success) {
          fetchBlogs();
          //   if (onDeleteBlog) {
          //     onDeleteBlog({ id, title });
          //   }
        }
      } catch (error) {
        console.error("Error deleting blog:", error);
      }
    }
  };

  // Handle toggle active status
  const handleToggleActive = async (blogId) => {
    try {
      const response = await fetch(`${API_BASE}/blog/${blogId}/toggle-active`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        fetchBlogs();
      } else {
        alert(data.message || "Failed to toggle blog status");
      }
    } catch (error) {
      console.error("Error toggling blog status:", error);
      alert("Failed to toggle blog status");
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, [currentPage, selectedCategory, sortBy, sortOrder, itemsPerPage, status]);

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
      <div className="bg-white rounded-lg shadow p-6 ">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search blogs..."
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
            {/* { !blogCategories && categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))} */}
            {blogCategories &&
              blogCategories.map((cat) => (
                <option key={cat._id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
          </select>

          {/* <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min Price"
              value={priceRange.min}
              onChange={(e) => {
                setPriceRange(prev => ({ ...prev, min: e.target.value }));
                setCurrentPage(1);
              }}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="number"
              placeholder="Max Price"
              value={priceRange.max}
              onChange={(e) => {
                setPriceRange(prev => ({ ...prev, max: e.target.value }));
                setCurrentPage(1);
              }}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div> */}

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="All">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
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
            <option value="most_viewed-desc">Most Viewed</option>
            <option value="most_liked-desc">Most Liked</option>
          </select>
        </div>
      </div>

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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Blog Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Views
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
                      Loading Blogs...
                    </div>
                  </td>
                </tr>
              ) : blogs.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    {searchTerm
                      ? `No blogs found for "${searchTerm}"`
                      : "No blogs found"}
                  </td>
                </tr>
              ) : (
                blogs.map((blog) => {
                  // Calculate number of images
                  //   let imageCount = 0;
                  //   if (product.images && Array.isArray(product.images)) {
                  //     imageCount = product.images.filter(
                  //       (img) => img && img.trim() !== "",
                  //     ).length;
                  //   } else if (product.image) {
                  //     imageCount = 1;
                  //   }

                  return (
                    <tr key={blog._id} className="hover:bg-gray-50 ">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap items-center ">
                          {/* <ProductImageDisplay product={product} /> */}
                          <div className=" ">
                            {/* <img src={blog.image} alt="blog" height={30} width={50} /> */}
                            <div className=" text-sm font-medium text-gray-900 break-words">
                              {blog.title}
                            </div>
                            {/* <div className="text-sm text-gray-500">ID: {product.id}</div>
                            {product.brand && (
                              <div className="text-xs text-gray-400">{product.brand}</div>
                            )} */}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {/* <button
                          onClick={() => handleViewImages(product)}
                          className="flex items-center gap-2 px-3 py-1 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 transition-colors"
                          disabled={imageCount === 0}
                        >
                          <Eye className="w-4 h-4" />
                          <span className="text-sm">
                            {imageCount > 0 ? `View ${imageCount} Image${imageCount > 1 ? 's' : ''}` : 'No Images'}
                          </span>
                        </button> */}
                        <div className="flex gap-2 items-center">
                          <img
                            src={blog.author.profileImage}
                            className="rounded-full h-10 w-10 object-cover"
                          />
                          <div className="text-sm font-medium text-gray-900">
                            {blog.author.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-pink-50 text-pink-600 rounded-full">
                          {blog.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap ">
                        <div className="text-sm text-gray-900 text-center">
                          {blog.views}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {/* <span className={`px-2 py-1 text-xs font-medium rounded-full ${product.available
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                          }`}>
                          {product.available ? 'Active' : 'Inactive'}
                        </span> */}

                        <Authorized permission={"blogs:update"}>
                          <button
                            onClick={() => handleToggleActive(blog._id)}
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all ${
                              blog.available
                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                : "bg-red-100 text-red-800 hover:bg-red-200"
                            }`}
                          >
                            {blog.available ? (
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
                        {blog.featured && (
                          <span className="ml-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                            Featured
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          {onViewBlog && (
                            <button
                              onClick={() => onViewBlog(blog)}
                              className="text-green-600 hover:text-green-900 transition-colors"
                              title="View Details"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                          )}

                          <Authorized permission={"blogs:update"}>
                            {onEditBlog && (
                              <button
                                onClick={() => onEditBlog(blog)}
                                className="text-blue-600 hover:text-blue-900 transition-colors"
                                title="Edit Blog"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                          </Authorized>

                          <Authorized permission={"blogs:delete"}>
                            <button
                              onClick={() =>
                                handleDeleteProduct(blog._id, blog.title)
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

      {/* <ImageModal /> */}
    </div>
  );
};

export default ViewBlogs;
