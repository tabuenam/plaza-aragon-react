import { ImageResponse } from "next/og";

export const alt = "Plaza Aragón · Locales comerciales en renta en Olanchito, Yoro";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #072b49 0%, #0b3b61 50%, #0d4a7a 100%)",
          padding: "56px 72px",
          fontFamily: "sans-serif",
          color: "#ffffff",
          position: "relative",
        }}
      >
        {/* Top gold accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "8px",
            background: "linear-gradient(90deg, #d97706, #fbbf24, #f59e0b)",
          }}
        />

        {/* Top Header Row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              backgroundColor: "rgba(255, 255, 255, 0.12)",
              padding: "8px 18px",
              borderRadius: "9999px",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: "#34d399",
              }}
            />
            <span
              style={{
                fontSize: "14px",
                fontWeight: 700,
                letterSpacing: "1.5px",
                color: "#fde68a",
                textTransform: "uppercase",
              }}
            >
              Olanchito, Yoro · Honduras
            </span>
          </div>

          <span
            style={{
              fontSize: "15px",
              fontWeight: 600,
              color: "rgba(255, 255, 255, 0.75)",
              letterSpacing: "0.5px",
            }}
          >
            plaza-aragon.com
          </span>
        </div>

        {/* Center Main Titles */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: "12px" }}>
          <h1
            style={{
              fontSize: "68px",
              fontWeight: 800,
              margin: 0,
              color: "#ffffff",
              letterSpacing: "-1.5px",
              lineHeight: 1.1,
            }}
          >
            Plaza Aragón
          </h1>
          <p
            style={{
              fontSize: "28px",
              margin: "14px 0 0 0",
              color: "#e2e8f0",
              fontWeight: 500,
            }}
          >
            Locales comerciales modernos en renta
          </p>
          <p
            style={{
              fontSize: "18px",
              margin: "8px 0 0 0",
              color: "#94a3b8",
            }}
          >
            Espacios diseñados para clínicas, bufetes profesionales y comercios con alta visibilidad.
          </p>
        </div>

        {/* Bottom Feature Badges */}
        <div style={{ display: "flex", gap: "16px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "16px",
              padding: "16px 20px",
            }}
          >
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#fbbf24", letterSpacing: "1px" }}>
              PRECIO MENSUAL
            </span>
            <span style={{ fontSize: "22px", fontWeight: 800, color: "#ffffff", marginTop: "4px" }}>
              Desde L. 8,000
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "16px",
              padding: "16px 20px",
            }}
          >
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#38bdf8", letterSpacing: "1px" }}>
              CONTRATOS
            </span>
            <span style={{ fontSize: "22px", fontWeight: 800, color: "#ffffff", marginTop: "4px" }}>
              6 a 12+ meses
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "16px",
              padding: "16px 20px",
            }}
          >
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#34d399", letterSpacing: "1px" }}>
              SERVICIOS
            </span>
            <span style={{ fontSize: "22px", fontWeight: 800, color: "#ffffff", marginTop: "4px" }}>
              Baño propio + A/C
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "16px",
              padding: "16px 20px",
            }}
          >
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#f472b6", letterSpacing: "1px" }}>
              PORTAL DIGITAL
            </span>
            <span style={{ fontSize: "22px", fontWeight: 800, color: "#ffffff", marginTop: "4px" }}>
              Pagos en línea
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
