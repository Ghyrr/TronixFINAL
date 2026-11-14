# TRONIX — Admin Guide

This guide explains how to access the admin dashboard, manage your store, and deploy the website.

---

## 1. First-Time Setup (Creating the Super Admin)

The first time you use the dashboard, there are no admin accounts yet. You need to create the **super admin** account — this is a one-time step.

1. Open your website and add `/admin/setup` to the address bar.
   - Example: `https://yourwebsite.com/admin/setup`
2. Fill in the form:
   - **Full Name** — your name (at least 2 characters).
   - **Email** — this will be your login email.
   - **Password** — at least 8 characters. Choose a strong password.
   - **Confirm Password** — re-enter the same password.
3. Click **Create Account**.
4. You will be redirected to the sign-in page. Sign in with your new email and password.

After this, the setup page is locked — nobody can create another super admin through it. You can create additional admins from inside the dashboard (see Section 9).

---

## 2. Signing In to the Dashboard

1. Go to `https://yourwebsite.com/admin/signin` (or just `/admin`).
2. Enter your email and password.
3. Click **Sign In**.

You will be taken to the admin overview page. The dashboard is **not visible** anywhere on the public storefront — there are no links to it in the header, footer, or navigation. Only people who know the `/admin` address and have an admin account can access it.

---

## 3. Dashboard Overview

The dashboard has a sidebar on the left with these sections:

| Section | What you can do |
|---|---|
| **Overview** | See stats: total products, orders, customers, sales. View low-stock alerts and recent orders. |
| **Products** | Add, edit, duplicate, delete products. Upload images, set prices, manage specs. |
| **Inventory** | Adjust stock levels, view stock movement history. |
| **Orders** | View and manage all orders, change order status. |
| **Customers** | View customer list and their order history. |
| **Settings** | Edit store info, announcement bar, shipping, banners, categories, brands. |
| **Admins** | Create and manage other admin accounts (super admin only). |
| **Activity** | View a log of all admin actions (super admin only). |

---

## 4. Managing Products

### Adding a New Product
1. Go to **Products** in the sidebar.
2. Click the **+** button (top right).
3. Fill in the product form:
   - **SKU** — a unique code for the product.
   - **Slug** — the URL-friendly name (auto-generated if left blank).
   - **Name (English)** and **Name (Arabic)** — the product name in both languages.
   - **Description (English)** and **Description (Arabic)**.
   - **Category** and **Brand** — select from dropdowns.
   - **Price** and **Sale Price** (optional — leave empty if no discount).
   - **Low Stock Threshold** — when stock drops below this number, you'll get an alert.
   - **Images** — upload one or more images. You can reorder them by dragging and remove them with the X button. Images are automatically optimized (converted to WebP, max 1600px, max 5MB).
   - **Specifications** — add specs like "RAM: 16GB", "Storage: 512GB SSD". Add as many as needed.
   - **Compatible Models** — list laptop models this part fits.
   - **Visibility toggles** — choose whether the product is visible on the store, featured, or marked as a best seller.
4. Click **Save**.

### Editing a Product
1. Go to **Products**.
2. Find the product and click the edit (pencil) button.
3. Make your changes and click **Save**.

### Duplicating a Product
1. Go to **Products**.
2. Find the product and click the duplicate button.
3. A copy is created with "(Copy)" added to the name and a new SKU. Edit it as needed.

### Deleting a Product
1. Go to **Products**.
2. Find the product and click the delete (trash) button.
3. Confirm the deletion. **This cannot be undone.**

---

## 5. Managing Inventory

### Adjusting Stock
1. Go to **Inventory** in the sidebar.
2. Find the product you want to adjust.
3. Click **Adjust**.
4. Enter the quantity change (positive to add stock, negative to remove).
5. Select a reason (new stock, correction, damaged, etc.).
6. Optionally add a note.
7. Click **Save**.

### Viewing Stock History
1. Go to **Inventory**.
2. Find the product and click **History**.
3. You'll see a log of all stock changes for that product, with dates, reasons, and notes.

---

## 6. Managing Orders

### Viewing Orders
1. Go to **Orders** in the sidebar.
2. You'll see a table of all orders with the order number, customer name, date, total, and status.
3. Use the search box to find orders by number or customer name.
4. Use the filter dropdown to filter by status (pending, confirmed, shipped, delivered, cancelled).

### Changing Order Status
1. Click on an order to open its detail view.
2. You'll see the customer's information, shipping address, items ordered, and totals.
3. Click the status buttons to change the order status (e.g., from Pending to Confirmed, or Confirmed to Shipped).

---

## 7. Managing Customers

1. Go to **Customers** in the sidebar.
2. You'll see a list of all customers with their name, phone, email, and order count.
3. Click on a customer to see their full order history.

---

## 8. Settings

The Settings page has **6 tabs**:

### General Tab
- **Store Name** — your store's name.
- **Currency** — your currency code (default: EGP).
- **Phone, WhatsApp, Email** — contact information shown on the store.
- **Address (English/Arabic)** — your store's address.
- **Logo and Favicon** — upload your store logo and favicon icon.
- **Social Media Links** — Facebook, Instagram, TikTok, X.
- **Announcement Bar**:
  - Toggle the announcement bar on/off.
  - Edit the announcement text in English and Arabic.
  - Change the scrolling speed (Slow, Normal, Fast).
- **Shipping Defaults**:
  - **Delivery Fee** — the default shipping fee (used when no governorate is selected).
  - **Free Delivery Threshold** — orders above this amount get free shipping.

### Homepage Tab
- Toggle which sections appear on the homepage: Hero slider, Categories, Featured products, Best sellers, Latest products.

### Banners Tab
- Add, edit, and delete homepage banner slides.
- Each banner has a title (EN/AR), subtitle (EN/AR), image, and optional link.
- Toggle banners active/inactive.
- Reorder by setting sort order.

### Categories Tab
- Add, edit, and delete product categories.
- Each category has an English name, Arabic name, and slug.
- Toggle categories active/inactive.

### Brands Tab
- Add, edit, and delete product brands.
- Each brand has a name and slug.
- Toggle brands active/inactive.

### Shipping Tab
- View and manage shipping fees for each Egyptian governorate.
- **Add a governorate**: click the + button, enter the English name, Arabic name, and delivery fee.
- **Edit a governorate**: click the pencil icon, change the fee or name, and save.
- **Delete a governorate**: click the trash icon and confirm.
- Toggle governorates active/inactive.
- The default delivery fee and free-shipping threshold (shown at the top) can be changed in the General tab.

When a customer checks out, they select their governorate from a dropdown. The shipping fee is automatically calculated based on the governorate they choose. If their order total is above the free-shipping threshold, shipping is free.

---

## 9. Managing Admin Accounts (Super Admin Only)

Only the super admin can access this section.

### Creating a New Admin
1. Go to **Admins** in the sidebar.
2. Click **+ New Admin**.
3. Fill in:
   - **Full Name**
   - **Email**
   - **Password** (at least 8 characters)
   - **Role**: Choose **Admin** (limited access) or **Super Admin** (full access).
4. If you choose **Admin**, select which sections they can access:
   - Products, Orders, Customers, Inventory, Settings
5. Click **Save**.

### Editing an Admin
1. Click the edit button next to an admin.
2. Change their name, role, permissions, or password (leave blank to keep current password).
3. Click **Save**.

### Activating/Deactivating an Admin
- Click the Activate/Deactivate button next to an admin.
- Deactivated admins cannot sign in.

### Important Notes
- You cannot deactivate or delete your own account.
- Super admins have access to everything and cannot have their permissions limited.
- Only super admins can see the Admins and Activity sections.

---

## 10. Activity Log (Super Admin Only)

The Activity page shows a log of every action taken by admins — creating products, changing orders, adjusting stock, updating settings, etc. This helps you track who did what and when.

---

## 11. Language and Currency

- The store supports **Arabic** and **English**. Customers can switch languages using the language toggle in the header.
- When Arabic is selected, the entire layout switches to right-to-left (RTL).
- All prices are displayed in **EGP (Egyptian Pound)** by default. You can change the currency code in Settings → General.

---

## 12. Deploying the Website

### Prerequisites
- The project is built with Vite. The build output goes to the `dist/` folder.
- The database (Supabase) is already provisioned and configured. The connection details are in the `.env` file.

### Build Steps
1. Run `npm install` to install dependencies.
2. Run `npm run build` to create the production build.
3. The `dist/` folder contains the files to deploy.

### Deploying to Netlify (or similar)
1. Connect your repository to Netlify (or your hosting provider).
2. Set the build command to `npm run build`.
3. Set the publish directory to `dist`.
4. Make sure the following environment variables are set in your hosting provider's dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SUPABASE_SERVICE_ROLE_KEY`
5. Deploy. The site will be live at your Netlify URL (or your custom domain).

### After Deployment
1. Visit `https://yourwebsite.com/admin/setup` to create your super admin account (first time only).
2. Sign in at `https://yourwebsite.com/admin/signin`.
3. Add your products, categories, brands, and configure your settings.

---

## 13. Troubleshooting

| Problem | Solution |
|---|---|
| **Can't access the dashboard** | Make sure you're going to `/admin` (not `/admin/` with a trailing slash). If no admins exist yet, go to `/admin/setup` first. |
| **Setup page says "already set up"** | An admin account already exists. Sign in at `/admin/signin` instead. |
| **Forgot admin password** | Contact another super admin to reset your password from the Admins section. If you're the only super admin, you'll need to reset the password directly in the Supabase dashboard. |
| **Changes not showing on the store** | The store caches settings for performance. Try refreshing the page. If the issue persists, check that you saved the changes in the dashboard. |
| **Images not uploading** | Make sure the image is under 5MB and is a valid image format (JPG, PNG, WebP, GIF). |
| **Can't delete a category or brand** | It may be in use by existing products. Remove or reassign the products first. |

---

## 14. Security Notes

- The admin dashboard is **not linked** from the public storefront. There are no buttons, links, or menus that lead to it.
- All admin routes are protected — unauthenticated visitors see only the sign-in page.
- Admin accounts are stored securely with Supabase Auth.
- Row-level security policies ensure admins can only access data they're authorized for.
- The super admin account has full access. Keep its password secure.
- Regular admin accounts only access the sections you grant them permission for.

---

For any questions not covered in this guide, refer to the project documentation or contact your developer.
