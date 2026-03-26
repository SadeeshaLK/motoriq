import Sidebar from "./Sidebar"
import Topbar from "./Topbar"

export default function DashboardLayout({ title, children }) {
  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 ml-64">
        <Topbar title={title} />

        <div className="p-10 bg-[#eef2f7] min-h-screen">
          {children}
        </div>
      </div>
    </div>
  )
}