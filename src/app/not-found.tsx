import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-shop py-32 text-center">
      <p className="text-6xl font-extrabold text-line">404</p>
      <h1 className="mt-4 section-title">Không tìm thấy trang</h1>
      <p className="mt-2 text-muted">Trang bạn tìm có thể đã được di chuyển hoặc không còn tồn tại.</p>
      <Link href="/shop" className="btn btn-primary mt-8">
        Về cửa hàng
      </Link>
    </div>
  );
}
