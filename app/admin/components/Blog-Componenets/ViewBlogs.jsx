"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Edit,
  Trash2,
  Search,
  Eye,
  Loader,
  Info,
  EyeOff,
  X,
} from "lucide-react";
import Pagination from "@/app/components/Pagination";
import Authorized from "@/app/components/Authorized";
import { toast } from "react-toastify";

const ViewBlogs = ({ onEditBlog, onViewBlog, onDeleteBlog }) => {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL;

  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  const [blogCategories, setBlogCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [selectedBlogIds, setSelectedBlogIds] = useState([]);
  const selectAllRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const getAuthHeaders = () => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("staffUserToken")
        : null;

    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const currentPageIds = useMemo(() => blogs.map((b) => b._id), [blogs]);

  const selectedOnPageCount = useMemo(
    () => blogs.filter((b) => selectedBlogIds.includes(b._id)).length,
    [blogs, selectedBlogIds],
  );

  const allOnPageSelected =
    blogs.length > 0 && selectedOnPageCount === blogs.length;

  const fetchBlogs = async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        category: selectedCategory,
        status,
        sortBy,
        sortOrder,
        available: "all",
      });

      const response = await fetch(
        `${API_BASE}/all-blogs?${params.toString()}`,
        {
          headers: getAuthHeaders(),
        },
      );

      const data = await response.json();

      if (data.success) {
        const fetchedBlogs = data.blogs || [];
        setBlogs(fetchedBlogs);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalItems(data.pagination?.totalBlogs || 0);

        // Keep selection only for currently visible page (safe UX for destructive actions)
        const pageIdSet = new Set(fetchedBlogs.map((b) => b._id));
        setSelectedBlogIds((prev) => prev.filter((id) => pageIdSet.has(id)));
      } else {
        setBlogs([]);
        setTotalPages(1);
        setTotalItems(0);
        setSelectedBlogIds([]);
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
      setBlogs([]);
      setTotalPages(1);
      setTotalItems(0);
      setSelectedBlogIds([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await fetch(`${API_BASE}/blog-categories?active=true`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();

      if (data.success && Array.isArray(data.blogCategories)) {
        const sorted = [...data.blogCategories].sort((a, b) => {
          if (a.order !== b.order) return a.order - b.order;
          return a.name.localeCompare(b.name);
        });
        setBlogCategories(sorted);
      } else {
        setBlogCategories([]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setBlogCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(() => {
      fetchBlogs();
    }, 500);
  };

  const handleDeleteSingle = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const response = await fetch(`${API_BASE}/delete-blog/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ title }),
      });

      const data = await response.json();

      if (data.success) {
        setSelectedBlogIds((prev) => prev.filter((blogId) => blogId !== id));
        await fetchBlogs();
        onDeleteBlog?.({ id, title });
      } else {
        alert(data.message || "Failed to delete blog");
      }
    } catch (error) {
      console.error("Error deleting blog:", error);
      alert("Failed to delete blog");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedBlogIds.length === 0) return;

    const confirmed = window.confirm(
      `Delete ${selectedBlogIds.length} selected blog(s)? This action cannot be undone.`,
    );
    if (!confirmed) return;

    setBulkDeleting(true);
    try {
      const response = await fetch(`${API_BASE}/delete-blogs/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ ids: selectedBlogIds }),
      });

      const data = await response.json();

      if (!data.success) {
        alert(data.message || "Failed to bulk delete blogs");
        return;
      }

      setSelectedBlogIds([]);
      await fetchBlogs();

      const extraInfo = [
        data.invalidIds?.length
          ? `Invalid IDs: ${data.invalidIds.length}`
          : null,
        data.notFoundIds?.length
          ? `Not found: ${data.notFoundIds.length}`
          : null,
      ]
        .filter(Boolean)
        .join(" | ");

      // alert(
      //   extraInfo
      //     ? `${data.message}\n${extraInfo}`
      //     : data.message || "Bulk delete completed",
      // );
      toast.success(
        extraInfo
          ? `${data.message}\n${extraInfo}`
          : data.message || "Bulk delete completed",
      );
    } catch (error) {
      console.error("Error bulk deleting blogs:", error);
      alert("Failed to bulk delete blogs");
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleToggleActive = async (blogId) => {
    try {
      const response = await fetch(`${API_BASE}/blog/${blogId}/toggle-active`, {
        method: "PATCH",
        headers: getAuthHeaders(),
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

  const handleSelectAllCurrentPage = (checked) => {
    if (checked) {
      setSelectedBlogIds((prev) =>
        Array.from(new Set([...prev, ...currentPageIds])),
      );
    } else {
      setSelectedBlogIds((prev) =>
        prev.filter((id) => !currentPageIds.includes(id)),
      );
    }
  };

  const handleSelectOne = (blogId, checked) => {
    if (checked) {
      setSelectedBlogIds((prev) => Array.from(new Set([...prev, blogId])));
    } else {
      setSelectedBlogIds((prev) => prev.filter((id) => id !== blogId));
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, [currentPage, selectedCategory, sortBy, sortOrder, itemsPerPage, status]);

  useEffect(() => {
    fetchCategories();
  }, [API_BASE]);

  useEffect(() => {
    if (!selectAllRef.current) return;
    selectAllRef.current.indeterminate =
      selectedOnPageCount > 0 && !allOnPageSelected;
  }, [selectedOnPageCount, allOnPageSelected]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
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
            {blogCategories.map((cat) => (
              <option key={cat._id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setCurrentPage(1);
            }}
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

      {selectedBlogIds.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-center justify-between">
          <p className="text-sm font-medium text-rose-900">
            {selectedBlogIds.length} blog(s) selected
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedBlogIds([])}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-white"
            >
              <X className="w-4 h-4" />
              Clear
            </button>

            <Authorized permission="blogs:delete">
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

      {searchTerm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            {loading ? "Searching..." : `Searching for "${searchTerm}"...`}
          </p>
        </div>
      )}

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
                    disabled={loading || blogs.length === 0}
                    className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500 cursor-pointer" 
                  />
                </th>
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
                    colSpan="7"
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
                    colSpan="7"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    {searchTerm
                      ? `No blogs found for "${searchTerm}"`
                      : "No blogs found"}
                  </td>
                </tr>
              ) : (
                blogs.map((blog) => (
                  <tr key={blog._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedBlogIds.includes(blog._id)}
                        onChange={(e) =>
                          handleSelectOne(blog._id, e.target.checked)
                        }
                        className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500 cursor-pointer"
                      />
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 break-words">
                        {blog.title}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2 items-center">
                        <img
                          src={blog.author?.profileImage}
                          alt={blog.author?.name || "Author"}
                          className="rounded-full h-10 w-10 object-cover"
                        />
                        <div className="text-sm font-medium text-gray-900">
                          {blog.author?.name || "-"}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-pink-50 text-pink-600 rounded-full">
                        {blog.category}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 text-center">
                        {blog.views}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <Authorized permission="blogs:update">
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

                        <Authorized permission="blogs:update">
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

                        <Authorized permission="blogs:delete">
                          <button
                            onClick={() =>
                              handleDeleteSingle(blog._id, blog.title)
                            }
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Delete Blog"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </Authorized>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={(page) => setCurrentPage(page)}
        onItemsPerPageChange={(perPage) => {
          setItemsPerPage(perPage);
          setCurrentPage(1);
        }}
        itemsPerPageOptions={[10, 20, 50, 100]}
      />
    </div>
  );
};

export default ViewBlogs;
