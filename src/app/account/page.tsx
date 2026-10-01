import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import AccountClient from "./AccountClient";

export default function AccountPage() {
  return <AccountClient header={<SiteHeader />} footer={<SiteFooter />} />;
}
