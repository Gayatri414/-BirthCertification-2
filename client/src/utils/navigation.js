import { FiHome, FiFileText, FiBell, FiAward, FiUser, FiLock, FiCheckSquare, FiPlusCircle, FiBarChart2, FiList, FiUsers, FiShield, FiSettings, FiXCircle, FiCheckCircle, FiActivity } from 'react-icons/fi';
import { MdOutlineLocalHospital } from 'react-icons/md';

export const NAV_BY_ROLE = {
  USER: [
    { to: '/user/dashboard', label: 'Dashboard', icon: FiHome },
    { to: '/user/applications', label: 'My Applications', icon: FiFileText },
    { to: '/user/certificates', label: 'Certificates', icon: FiAward },
    { to: '/user/verify-certificate', label: 'Verify Certificate', icon: FiCheckSquare },
    { to: '/user/notifications', label: 'Notifications', icon: FiBell },
    { to: '/user/profile', label: 'Profile', icon: FiUser },
    { to: '/user/change-password', label: 'Change Password', icon: FiLock },
  ],
  HOSPITAL: [
    { to: '/hospital/dashboard', label: 'Dashboard', icon: FiHome },
    { to: '/hospital/registrations', label: 'Registrations', icon: FiList },
    { to: '/hospital/registrations/new', label: 'New Registration', icon: FiPlusCircle },
    { to: '/hospital/notifications', label: 'Notifications', icon: FiBell },
    { to: '/hospital/profile', label: 'Profile', icon: FiUser },
  ],
  MUNICIPAL_OFFICER: [
    { to: '/municipal/dashboard', label: 'Dashboard', icon: FiHome },
    { to: '/municipal/applications', label: 'Applications', icon: FiFileText },
    { to: '/municipal/approved', label: 'Approved', icon: FiCheckCircle },
    { to: '/municipal/rejected', label: 'Rejected', icon: FiXCircle },
    { to: '/municipal/reports', label: 'Reports', icon: FiBarChart2 },
    { to: '/municipal/audit-logs', label: 'Audit Logs', icon: FiActivity },
    { to: '/municipal/notifications', label: 'Notifications', icon: FiBell },
    { to: '/municipal/profile', label: 'Profile', icon: FiUser },
  ],
  SUPER_ADMIN: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: FiHome },
    { to: '/admin/users', label: 'Users', icon: FiUsers },
    { to: '/admin/hospitals', label: 'Hospitals', icon: MdOutlineLocalHospital },
    { to: '/admin/officers', label: 'Officers', icon: FiShield },
    { to: '/admin/applications', label: 'Applications', icon: FiFileText },
    { to: '/admin/certificates', label: 'Certificates', icon: FiAward },
    { to: '/admin/notifications', label: 'Notifications', icon: FiBell },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: FiActivity },
    { to: '/admin/settings', label: 'Settings', icon: FiSettings },
  ],
};

export const NOTIFICATIONS_PATH = {
  USER: '/user/notifications',
  HOSPITAL: '/hospital/notifications',
  MUNICIPAL_OFFICER: '/municipal/notifications',
  SUPER_ADMIN: '/admin/notifications',
};

// Where a notification about an application should lead, per role.
export const applicationPathFor = (role, id) => ({
  USER: `/user/application/${id}`,
  HOSPITAL: `/hospital/registrations/${id}`,
  MUNICIPAL_OFFICER: `/municipal/applications/${id}`,
  SUPER_ADMIN: null,
}[role] || null);
