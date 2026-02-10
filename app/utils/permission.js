// lib/permissions.js
export function computePermissions(roles = []) {
  // roles: [{ name, permissions: [...] }]
  const perms = new Set();
  roles.forEach(r => (r.permissions || []).forEach(p => perms.add(p)));
  return perms;
}

export function hasPermission(staffUser , permission) {

  const staffUserData = JSON.parse(staffUser)
  if (!staffUserData) return false;
  // super-protected users
  if (staffUserData.isProtected) return true;

//    const token = localStorage.getItem('staffUserDataToken');
//    const storedAdminData = localStorage.getItem('staffUserDataData');
  return staffUserData?.permissions?.includes(permission);
   
      

}
