import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-lux py-32 text-center">
      <p className="eyebrow text-gold-deep">Lỗi 404</p>
      <h1 className="mt-4 font-serif text-5xl font-medium">Không tìm thấy trang</h1>
      <p className="mt-4 text-stone">Trang bạn tìm có thể đã được di chuyển hoặc không còn tồn tại.</p>
      <Link href="/shop" className="btn btn-primary mt-10">
        Về cửa hàng
      </Link>
    </div>
  );
}
