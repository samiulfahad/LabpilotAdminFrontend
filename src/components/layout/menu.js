import {
  LayoutDashboard,
  FlaskConical,
  SlidersHorizontal,
  BookOpen,
  MapPin,
  WashingMachine,
  UploadCloud,
} from "lucide-react";

import {} from "lucide-react";

const menu = [
  { label: "Home", path: "/", icon: LayoutDashboard },
  { label: "Support Inbox", path: "/support-inbox", icon: WashingMachine },
  { label: "Labs", path: "/labs", icon: FlaskConical },
  { label: "Lab Staffs", path: "/lab-staffs", icon: FlaskConical },
  { label: "Support Admins", path: "/support-admin", icon: FlaskConical },
  { label: "Billing", path: "/billing", icon: MapPin },
  { label: "Lab Management", path: "/lab-management", icon: SlidersHorizontal },
  { label: "Test Catalog", path: "/test-catalog", icon: BookOpen },
  { label: "Schema Engine", path: "/schema-engine", icon: WashingMachine },
  { label: "Zones", path: "/zones", icon: MapPin },
  { label: "Account", path: "/account", icon: MapPin },
];

export default menu;
