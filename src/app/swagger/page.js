"use client";

export default function SwaggerPage() {
  return (
    <div style={{ height: "100vh" }}>
      <iframe
        title="API Docs"
        src="/swagger.html"
        style={{ width: "100%", height: "100%", border: 0 }}
      />
    </div>
  );
}
