import React, { useState, useEffect } from "react";
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  Check,
  AlertCircle,
  Users,
  ChevronDown,
  ChevronUp,
  Loader,
  Eye,
  EyeOff,
} from "lucide-react";
import Authorized from "@/app/components/Authorized"; // your existing Authorized component
import { toast } from "react-toastify";

/* -------------------- Permissions config -------------------- */
const PERMISSIONS = {
  PRODUCTS: [
    "products:create",
    "products:read",
    "products:update",
    "products:delete",
  ],
  BLOGS: ["blogs:create", "blogs:read", "blogs:update", "blogs:delete"],
  CATEGORIES: [
    "categories:create",
    "categories:read",
    "categories:update",
    "categories:delete",
  ],
  BLOG_CATEGORIES: [
    "blogCategories:create",
    "blogCategories:read",
    "blogCategories:update",
    "blogCategories:delete",
  ],
  ORDERS: ["orders:create", "orders:read", "orders:update", "orders:delete"],
  PROMO_CODES: [
    "promoCodes:create",
    "promoCodes:read",
    "promoCodes:update",
    "promoCodes:delete",
  ],
  ANALYTICS: ["analytics:read"],
  WISHLISTS: ["wishlists:read"],
  NOTIFICATIONS: ["notifications:read"],
  SETTINGS: [
    "settings:create",
    "settings:read",
    "settings:update",
    "settings:delete",
  ],
  ROLES: ["roles:create", "roles:read", "roles:update", "roles:delete"],
  CONTACTS: [
    "contacts:create",
    "contacts:read",
    "contacts:update",
    "contacts:delete",
  ],
  TEAM: ["team:create", "team:read", "team:update", "team:delete"],
};

const ALL_PERMISSIONS = Object.values(PERMISSIONS).flat();

const RESOURCE_LABELS = {
  PRODUCTS: "Products",
  BLOGS: "Blog Posts",
  CATEGORIES: "Categories",
  BLOG_CATEGORIES: "Blog Categories",
  ORDERS: "Orders",
  PROMO_CODES: "Promo Codes",
  ANALYTICS: "Analytics",
  WISHLISTS: "Wishlists",
  NOTIFICATIONS: "Notifications",
  SETTINGS: "Settings",
  ROLES: "Roles",
  CONTACTS: "Contacts",
  TEAM: "Teams",
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

/* -------------------- component -------------------- */
const RolesManager = () => {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("staffUserToken")
      : null;

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    roleId: null,
  });
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [saving, setSaving] = useState(false);
  const [expandedResources, setExpandedResources] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: [],
    protected: false,
  });

  // fetch roles from backend
  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/roles`, {
        method: "GET",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });
      if (res.status === 401) {
        // unauthorized - let Authorized or global handler deal with it
        setRoles([]);
        setLoading(false);
        return;
      }
      const data = await res.json();
      // expect an array
      setRoles(Array.isArray(data) ? data : data.roles || []);
    } catch (err) {
      console.error("Failed to load roles", err);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // notifications
  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: "", type: "" }), 3500);
  };

  // filtered roles based on search
  const filteredRoles = roles.filter(
    (role) =>
      role.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // UI handlers
  const toggleResource = (resource) => {
    setExpandedResources((prev) => ({ ...prev, [resource]: !prev[resource] }));
  };

  const togglePermission = (permission) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const toggleResourcePermissions = (resource, permissions) => {
    const allSelected = permissions.every((p) =>
      formData.permissions.includes(p),
    );
    if (allSelected) {
      setFormData((prev) => ({
        ...prev,
        permissions: prev.permissions.filter((p) => !permissions.includes(p)),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        permissions: Array.from(new Set([...prev.permissions, ...permissions])),
      }));
    }
  };

  const openCreateModal = () => {
    setEditingRole(null);
    setFormData({
      name: "",
      description: "",
      permissions: [],
      protected: false,
    });
    setExpandedResources({});
    setShowModal(true);
  };

  const openEditModal = (role) => {
    setEditingRole(role);
    setFormData({
      name: role.name || "",
      description: role.description || "",
      permissions: Array.isArray(role.permissions) ? [...role.permissions] : [],
      protected: !!role.protected,
    });
    setExpandedResources({});
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Role name is required");
      return;
    }
    if (formData.permissions.length === 0) {
      toast.error("Select at least one permission");
      return;
    }

    setSaving(true);
    try {
      if (editingRole) {
        const res = await fetch(`${API_BASE}/roles/${editingRole._id}`, {
          method: "PUT",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            permissions: formData.permissions,
            protected: formData.protected,
          }),
        });
        if (res.status === 200) {
          toast.success("Role updated successfully");
        } else {
          const err = await res
            .json()
            .catch(() => ({ error: "Update failed" }));
          toast.error(err?.error || "Failed to update role");
        }
      } else {
        const res = await fetch(`${API_BASE}/roles`, {
          method: "POST",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            permissions: formData.permissions,
            protected: formData.protected,
          }),
        });
        if (res.status === 200 || res.status === 201) {
          toast.success("Role created successfully");
        } else {
          const err = await res
            .json()
            .catch(() => ({ error: "Create failed" }));
          toast.error(err?.error || "Failed to create role", "error");
        }
      }

      await fetchRoles();
      setShowModal(false);
    } catch (err) {
      console.error("Save role error", err);
      toast.error("Server error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (roleId) => {
    if (!window.confirm("Are you sure you want to delete this role?")) {
      setDeleteConfirm({ show: false, roleId: null });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/roles/${roleId}`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });

      if (res.status === 200) {
        toast.success("Role deleted successfully");
        await fetchRoles();
      } else {
        const err = await res.json().catch(() => ({ error: "Delete failed" }));
        toast.error(err?.error || "Failed to delete role");
      }
    } catch (err) {
      console.error("Delete role error", err);
      toast.error("Server error");
    } finally {
      setSaving(false);
      setDeleteConfirm({ show: false, roleId: null });
    }
  };

  const handleToggleActive = async (role) => {
    if (role.protected) {
      toast.error("Protected roles cannot be deactivated");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/roles/${role._id}/toggle-active`, {
        method: "PATCH",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        toast.success(
          `Role ${role.active ? "deactivated" : "activated"}`
        );
        await fetchRoles();
      } else {
        const err = await res.json().catch(() => ({ error: "Toggle failed" }));
        toast.error(err?.error || "Failed to toggle role");
      }
    } catch (err) {
      console.error("Toggle role error", err);
      toast.error("Server error");
    }
  };

  const getActionLabel = (permission) => {
    const action = permission.split(":")[1] || permission;
    return action.charAt(0).toUpperCase() + action.slice(1);
  };

  const totalPermissions = roles.reduce(
    (sum, r) => sum + (r.permissions?.length || 0),
    0,
  );
  const totalUsers = roles.reduce((sum, r) => sum + (r.usersCount || 0), 0);

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
              Roles Management
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Create and manage user roles
            </p>
          </div>

          <Authorized permission="roles:create">
            <button
              onClick={openCreateModal}
              className={`flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors text-sm sm:text-base`}
            >
              <Plus className="w-4 h-4" />
              <span>Create Role</span>
            </button>
          </Authorized>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Total Roles</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800">
                {roles.length}
              </p>
            </div>
            <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-pink-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Permissions</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800">
                {ALL_PERMISSIONS.length}
              </p>
            </div>
            <Check className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Assigned</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800">
                {totalPermissions}
              </p>
            </div>
            <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full bg-white rounded-lg shadow p-6 text-center">
            <Loader className="w-6 h-6 animate-spin mx-auto mb-2" />
            Loading roles...
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow p-12 text-center">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No roles found</p>
          </div>
        ) : (
          filteredRoles.map((role) => {
            const permissionPercentage = Math.round(
              ((role.permissions?.length || 0) / ALL_PERMISSIONS.length) * 100,
            );

            return (
              <div
                key={role._id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                {/* Card Header */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {role.name}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Authorized permission="roles:update">
                        <button
                          onClick={() => openEditModal(role)}
                          className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </Authorized>
                      <Authorized permission="roles:delete">
                        <button
                          onClick={() =>
                            setDeleteConfirm({ show: true, roleId: role._id })
                          }
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </Authorized>
                      <Authorized permission={"roles:update"}>
                        <button
                          onClick={() => handleToggleActive(role)}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all ${
                            role.active
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          }`}
                        >
                          {role.active ? (
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
                      {/* <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            role.active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {role.active ? "Active" : "Inactive"}
                        </span>

                        <Authorized permission="roles:update">
                          <button
                            onClick={() => handleToggleActive(role)}
                            className={`text-xs px-2 py-1 rounded-lg border ${
                              role.active
                                ? "border-red-200 text-red-600 hover:bg-red-50"
                                : "border-green-200 text-green-700 hover:bg-green-50"
                            }`}
                          >
                            {role.active ? "Deactivate" : "Activate"}
                          </button>
                        </Authorized>
                      </div> */}
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4">
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {role.description}
                  </p>

                  {/* Permission Progress */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">Permissions</span>
                      <span className="font-medium text-gray-700">
                        {role.permissions?.length ?? 0}/{ALL_PERMISSIONS.length}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-pink-500 to-pink-600 h-2 rounded-full transition-all"
                        style={{ width: `${permissionPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Permission Tags */}
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(PERMISSIONS)
                      .slice(0, 4)
                      .map(([resource]) => {
                        const resourcePerms = PERMISSIONS[resource];
                        const hasAny = resourcePerms.some((p) =>
                          role.permissions?.includes(p),
                        );
                        const hasAll = resourcePerms.every((p) =>
                          role.permissions?.includes(p),
                        );

                        if (!hasAny) return null;

                        return (
                          <span
                            key={resource}
                            className={`text-xs px-2 py-1 rounded bg-green-100 text-green-700`}
                          >
                            {RESOURCE_LABELS[resource]}
                          </span>
                        );
                      })}
                    {Object.entries(PERMISSIONS).filter(([resource]) => {
                      const resourcePerms = PERMISSIONS[resource];
                      return resourcePerms.some((p) =>
                        role.permissions?.includes(p),
                      );
                    }).length > 4 && (
                      <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                        +
                        {Object.entries(PERMISSIONS).filter(([resource]) => {
                          const resourcePerms = PERMISSIONS[resource];
                          return resourcePerms.some((p) =>
                            role.permissions?.includes(p),
                          );
                        }).length - 4}{" "}
                        more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                {editingRole ? "Edit Role" : "Create Role"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto">
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                      placeholder="e.g., Content Manager"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm resize-none"
                      placeholder="Brief description of this role"
                    />
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">
                      Permissions <span className="text-red-500">*</span>
                    </label>
                    <span className="text-xs text-gray-500">
                      {formData.permissions.length} selected
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[40vh] overflow-y-auto border border-gray-200 rounded-lg">
                    {Object.entries(PERMISSIONS).map(
                      ([resource, permissions]) => {
                        const allSelected = permissions.every((p) =>
                          formData.permissions.includes(p),
                        );
                        const someSelected = permissions.some((p) =>
                          formData.permissions.includes(p),
                        );
                        const isExpanded = !!expandedResources[resource];

                        return (
                          <div
                            key={resource}
                            className="border-b border-gray-100 last:border-0"
                          >
                            {/* Resource Header */}
                            <div
                              className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                              onClick={() => toggleResource(resource)}
                            >
                              <div className="flex items-center gap-2 sm:gap-3">
                                <input
                                  type="checkbox"
                                  checked={allSelected}
                                  ref={(input) => {
                                    if (input)
                                      input.indeterminate =
                                        someSelected && !allSelected;
                                  }}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    toggleResourcePermissions(
                                      resource,
                                      permissions,
                                    );
                                  }}
                                  className="w-4 h-4 text-pink-500 rounded focus:ring-pink-500"
                                />
                                <span className="text-xs sm:text-sm font-medium text-gray-700">
                                  {RESOURCE_LABELS[resource]}
                                </span>
                                <span className="text-xs text-gray-400 hidden sm:inline">
                                  (
                                  {
                                    permissions.filter((p) =>
                                      formData.permissions.includes(p),
                                    ).length
                                  }
                                  /{permissions.length})
                                </span>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-gray-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              )}
                            </div>

                            {/* Permissions List */}
                            {isExpanded && (
                              <div className="px-3 pb-3 pl-8 sm:pl-10">
                                <div className="flex flex-wrap gap-2">
                                  {permissions.map((permission) => (
                                    <label
                                      key={permission}
                                      className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg cursor-pointer transition-colors text-xs sm:text-sm ${
                                        formData.permissions.includes(
                                          permission,
                                        )
                                          ? "bg-pink-100 text-pink-700 border border-pink-200"
                                          : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent"
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={formData.permissions.includes(
                                          permission,
                                        )}
                                        onChange={() =>
                                          togglePermission(permission)
                                        }
                                        className="sr-only"
                                      />
                                      <span>{getActionLabel(permission)}</span>
                                      {formData.permissions.includes(
                                        permission,
                                      ) && (
                                        <Check className="w-3 h-3 hidden sm:block" />
                                      )}
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-pink-500 text-white rounded-lg font-medium hover:bg-pink-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  {saving ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span className="hidden sm:inline">Saving...</span>
                    </>
                  ) : (
                    <span>{editingRole ? "Update Role" : "Create Role"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation (follows same pattern as your other tabs) */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>

            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
              Delete Role?
            </h3>

            <p className="text-gray-600 text-center text-sm mb-6">
              This action cannot be undone. Users with this role will lose their
              permissions.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm({ show: false, roleId: null })}
                disabled={saving}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <Authorized permission="roles:delete">
                <button
                  onClick={() => handleDelete(deleteConfirm.roleId)}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  {saving ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    "Delete"
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

export default RolesManager;
