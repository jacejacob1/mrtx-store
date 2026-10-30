import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { BagDrawer } from "@/components/BagDrawer";
import { CatalogueProvider } from "@/components/CatalogueProvider";
import { getCatalogue } from "@/lib/server/catalogue";

/**
 * The shop: nav, bag and footer around every public page, and the live
 * catalogue handed to the client components that need it.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const products = await getCatalogue();
  return (
    <CatalogueProvider products={products}>
      <Nav />
      <main id="main">{children}</main>
      <Footer />
      <BagDrawer />
    </CatalogueProvider>
  );
}
