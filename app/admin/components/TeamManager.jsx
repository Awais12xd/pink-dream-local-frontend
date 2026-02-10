"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Loader,
  Filter,
  UserCheck,
  UserX,
  RefreshCw,
} from "lucide-react";
import Authorized from "@/app/components/Authorized"; // your existing wrapper

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

const TeamManager = () => {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("staffUserToken")
      : null;

  const [members, setMembers] = useState([]);
  const [rolesList, setRolesList] = useState([]); // roles for the select
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    memberId: null,
  });
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    status: "active",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});

  // Notifications helper
  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: "", type: "" }), 3000);
  };

  // Defensive mapper for server user -> UI member item
  const mapStaffToMember = (user) => {
    // backend may provide: { _id, email, role, name?, lastLogin?, status, createdAt, usersCount? }
    const name =
      user.name || (user.email ? user.email.split("@")[0] : "No name");
    const role =
      user.role && typeof user.role === "string"
        ? user.role
        : (user.roles && user.roles[0]?.name) || "N/A";
    return {
      _id: user._id || user.id,
      name,
      email: user.email || "",
      // phone intentionally removed per request
      role,
      status: user.status || "inactive",
      lastLogin: user.lastLogin || user.last_login || null,
      createdAt:
        user.createdAt ||
        user.created_at ||
        user.created ||
        new Date().toISOString(),
    };
  };

  // Fetch staff users
  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/staffUsers`, {
        method: "GET",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });

      if (res.status === 401) {
        setMembers([]);
        setLoading(false);
        return;
      }

      const data = await res.json();
      // If controller returns an array directly, use it; otherwise try data.staffUsers or data.users
      const list = Array.isArray(data)
        ? data
        : data.staffUsers || data.users || [];
      setMembers(list.map(mapStaffToMember));
    } catch (err) {
      console.error("Failed to load staff users", err);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch roles for select
  const fetchRoles = async () => {
    setLoadingRoles(true);
    try {
      const res = await fetch(`${API_BASE}/roles`, {
        method: "GET",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });

      if (res.status === 401) {
        setRolesList([]);
        setLoadingRoles(false);
        return;
      }

      const data = await res.json();
      // normalize: roles array of objects { _id, name }
      const list = Array.isArray(data) ? data : data.roles || [];
      setRolesList(list.map((r) => r.name || r._id));
    } catch (err) {
      console.error("Failed to load roles", err);
      setRolesList([]);
    } finally {
      setLoadingRoles(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filters
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || member.role === roleFilter;
    const matchesStatus = !statusFilter || member.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setRoleFilter("");
    setStatusFilter("");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return formatDate(dateString);
  };

  // Validation
  const validateForm = () => {
    const newErrors = {};
    // if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Invalid email format";
    if (!formData.role) newErrors.role = "Role is required";
    if (!editingMember) {
      if (!formData.password) newErrors.password = "Password is required";
      else if (formData.password.length < 8)
        newErrors.password = "Min 8 characters";
      if (formData.password !== formData.confirmPassword)
        newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Create modal
  const openCreateModal = () => {
    setEditingMember(null);
    setFormData({
      name: "",
      email: "",
      role: "",
      status: "active",
      password: "",
      confirmPassword: "",
    });
    setErrors({});
    setShowPassword(false);
    setShowModal(true);
  };

  // Edit modal
  const openEditModal = (member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      role: member.role,
      status: member.status,
      password: "",
      confirmPassword: "",
    });
    setErrors({});
    setShowModal(true);
  };

  // Save (create or update)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      if (editingMember) {
        const res = await fetch(`${API_BASE}/staffUsers/${editingMember._id}`, {
          method: "PUT",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            status: formData.status,
            role: formData.role,
          }),
        });

        if (res.status === 200) {
          showNotification("Member updated successfully", "success");
        } else {
          const err = await res
            .json()
            .catch(() => ({ error: "Update failed" }));
          showNotification(err?.error || "Failed to update member", "error");
        }
      } else {
        const res = await fetch(`${API_BASE}/staffUsers`, {
          method: "POST",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            role: formData.role,
          }),
        });

        if (res.status === 200 || res.status === 201) {
          showNotification("Member added successfully", "success");
        } else {
          const err = await res
            .json()
            .catch(() => ({ error: "Create failed" }));
          showNotification(err?.error || "Failed to add member", "error");
        }
      }

      await fetchMembers();
      setShowModal(false);
    } catch (err) {
      console.error("Save member error", err);
      showNotification("Server error", "error");
    } finally {
      setSaving(false);
    }
  };

  // Toggle active/inactive
  const toggleStatus = async (memberId) => {
    // optimistic UI
    setMembers((prev) =>
      prev.map((m) =>
        m._id === memberId
          ? { ...m, status: m.status === "active" ? "inactive" : "active" }
          : m,
      ),
    );
    showNotification("Status updated");

    // sync with backend (best-effort)
    try {
      const target = members.find((m) => m._id === memberId);
      if (!target) return;
      await fetch(`${API_BASE}/staffUsers/${memberId}`, {
        method: "PUT",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: target.status === "active" ? "inactive" : "active",
        }),
      });
      // refresh list
      await fetchMembers();
    } catch (err) {
      console.error("Toggle status error", err);
      // revert on error
      await fetchMembers();
      showNotification("Failed to update status", "error");
    }
  };

  // Delete member
  const handleDelete = async (memberId) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/staffUsers/${memberId}`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });

      if (res.status === 200) {
        showNotification("Member removed successfully", "success");
        await fetchMembers();
      } else {
        const err = await res.json().catch(() => ({ error: "Delete failed" }));
        showNotification(err?.error || "Failed to remove member", "error");
      }
    } catch (err) {
      console.error("Delete member error", err);
      showNotification("Server error", "error");
    } finally {
      setSaving(false);
      setDeleteConfirm({ show: false, memberId: null });
    }
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const activeCount = members.filter((m) => m.status === "active").length;
  const inactiveCount = members.filter((m) => m.status === "inactive").length;

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification.message && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 ${
            notification.type === "success" ? "bg-green-500" : "bg-red-500"
          } text-white max-w-md`}
        >
          {notification.type === "success" ? (
            <Check size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification({ message: "", type: "" })}
            className="ml-2"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
              Team Management
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Manage your staff accounts
            </p>
          </div>
          <Authorized permission="team:create">
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors text-sm sm:text-base"
            >
              <Plus className="w-4 h-4" />
              <span>Add Member</span>
            </button>
          </Authorized>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Total</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800">
                {members.length}
              </p>
            </div>
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-pink-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Active</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">
                {activeCount}
              </p>
            </div>
            <UserCheck className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Inactive</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-600">
                {inactiveCount}
              </p>
            </div>
            <UserX className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent appearance-none bg-white text-sm"
            >
              <option value="">All Roles</option>
              {rolesList.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent appearance-none bg-white text-sm"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Reset */}
          <button
            onClick={resetFilters}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-600"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Team Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Role
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                  Joined
                </th>
                <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                      Loading staff...
                    </div>
                  </td>
                </tr>
              ) : filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                  <tr key={member._id} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-medium text-xs sm:text-sm">
                            {getInitials(member.name)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {member.name}
                          </p>
                          <p className="text-gray-500 text-xs truncate">
                            {member.email}
                          </p>
                          <p className="text-gray-400 text-xs md:hidden">
                            {member.role}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-700">
                        {member.role}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      {/* <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${member.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                      >
                        {member.status === "active" ? "Active" : "Inactive"}
                      </span> */}
                      <button
                          onClick={() => toggleStatus(member._id)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${member.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                          title={
                            member.status === "active"
                              ? "Deactivate"
                              : "Activate"
                          }
                        >
                          {member.status === "active" ? (
                            "Active"
                          ) : (
                            "Inactive"
                          )}
                        </button>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-500 hidden xl:table-cell">
                      {formatDate(member.createdAt)}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Authorized permission="team:update">
                          <button
                            onClick={() => openEditModal(member)}
                            className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </Authorized>

                        <Authorized permission="team:delete">
                          <button
                            onClick={() =>
                              setDeleteConfirm({
                                show: true,
                                memberId: member._id,
                              })
                            }
                            className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </Authorized>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No team members found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                {editingMember ? "Edit Member" : "Add Member"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto">
              <div className="p-4 sm:p-6 space-y-4">

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm ${errors.email ? "border-red-500" : "border-gray-300"}`}
                    placeholder="john@example.com"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm ${errors.role ? "border-red-500" : "border-gray-300"}`}
                  >
                    <option value="">Select Role</option>
                    {loadingRoles ? (
                      <option>Loading...</option>
                    ) : (
                      rolesList.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))
                    )}
                  </select>
                  {errors.role && (
                    <p className="text-red-500 text-xs mt-1">{errors.role}</p>
                  )}
                </div>

                {/* Status (Edit only) */}
                {editingMember && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                )}

                {/* Password (Create only) */}
                {!editingMember && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              password: e.target.value,
                            })
                          }
                          className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm ${errors.password ? "border-red-500" : "border-gray-300"}`}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.password}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            confirmPassword: e.target.value,
                          })
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm ${errors.confirmPassword ? "border-red-500" : "border-gray-300"}`}
                        placeholder="••••••••"
                      />
                      {errors.confirmPassword && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors text-sm"
                >
                  Cancel
                </button>
                <Authorized
                  permission={
                    editingMember ? "team:update" : "team:create"
                  }
                >
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2.5 bg-pink-500 text-white rounded-lg font-medium hover:bg-pink-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                  >
                    {saving ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>{editingMember ? "Update" : "Add Member"}</span>
                    )}
                  </button>
                </Authorized>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>

            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
              Remove Member?
            </h3>
            <p className="text-gray-600 text-center text-sm mb-6">
              This will remove the member from your team. This action cannot be
              undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() =>
                  setDeleteConfirm({ show: false, memberId: null })
                }
                disabled={saving}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <Authorized permission="team:delete">
                <button
                  onClick={() => handleDelete(deleteConfirm.memberId)}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  {saving ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    "Remove"
                  )}
                </button>
              </Authorized>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManager;
