import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { formatDuration, formatRunDate } from "@/lib/format";

// Draws the 9:16 WhatsApp-status card. Separate from the route so it can be
// rendered with sample data while designing it.

const W = 1080;
const H = 1920;
const NAVY = "#101820";
const SUNRISE = "#F97316";
const TEAL = "#0F766E";

// Fonts don't depend on the request, so load them once.
const fonts = Promise.all([
  readFile(join(process.cwd(), "assets/fonts/BarlowCondensed-Bold.ttf")),
  readFile(join(process.cwd(), "assets/fonts/Barlow-Medium.ttf")),
]);

export type CardData = {
  name: string;
  paceGroup: string | null;
  runTitle: string;
  runDate: string; // YYYY-MM-DD
  km: number | null; // null if they checked in but didn't log
  durationSeconds: number | null;
  streak: number;
  saturdays: number;
  totalKm: number;
};

export async function cardImage(d: CardData) {
  const [condensed, body] = await fonts;
  const km = d.km != null ? d.km.toFixed(1) : null;
  const { streak, saturdays, totalKm } = d;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: NAVY,
          color: "white",
          fontFamily: "Barlow",
          padding: "120px 90px 0",
          position: "relative",
        }}
      >
        {/* Sunrise over the horizon */}
        <div
          style={{
            position: "absolute",
            left: 140,
            bottom: -600,
            width: 800,
            height: 800,
            borderRadius: 400,
            background: `linear-gradient(180deg, ${SUNRISE} 0%, #C2410C 70%)`,
            opacity: 0.9,
          }}
        />

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontFamily: "Barlow Condensed", fontSize: 54, letterSpacing: 8, color: SUNRISE }}>
            MORNING MILE CLUB
          </div>
          <div style={{ fontSize: 40, color: "rgba(255,255,255,0.7)", marginTop: 8 }}>
            {d.runTitle + " · " + formatRunDate(d.runDate)}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 170 }}>
          <div style={{ fontSize: 52, color: "rgba(255,255,255,0.8)" }}>{km ? "I ran" : "I showed up"}</div>
          {km ? (
            <div style={{ display: "flex", alignItems: "baseline", fontFamily: "Barlow Condensed" }}>
              <div style={{ fontSize: 400, lineHeight: 1 }}>{km}</div>
              <div style={{ fontSize: 120, marginLeft: 24, color: SUNRISE }}>KM</div>
            </div>
          ) : (
            <div style={{ fontFamily: "Barlow Condensed", fontSize: 220, lineHeight: 1 }}>AT 6 AM</div>
          )}
          {d.durationSeconds ? (
            <div style={{ fontSize: 52, color: "rgba(255,255,255,0.8)" }}>
              {"in " + formatDuration(d.durationSeconds)}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 30,
            color: "rgba(255,255,255,0.65)",
            marginTop: 60,
          }}
        >
          Gbagada → Harvesters → Anthony → Maryland Mall → Gbagada
        </div>

        <div style={{ display: "flex", gap: 24, marginTop: 70 }}>
          {[
            [String(streak), "WEEK STREAK"],
            [String(saturdays), saturdays === 1 ? "SATURDAY" : "SATURDAYS"],
            [totalKm.toFixed(0), "CLUB KM"],
          ].map(([value, label]) => (
            <div
              key={label}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                padding: "28px 30px",
                borderRadius: 28,
                background: "rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ fontFamily: "Barlow Condensed", fontSize: 110, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 28, color: "rgba(255,255,255,0.7)", letterSpacing: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            position: "absolute",
            left: 90,
            right: 90,
            bottom: 250,
            alignItems: "center",
          }}
        >
          <div style={{ fontFamily: "Barlow Condensed", fontSize: 72 }}>{d.name.toUpperCase()}</div>
          <div style={{ display: "flex", fontSize: 34, color: "white", opacity: 0.9 }}>
            {(d.paceGroup ? `${capitalize(d.paceGroup)} group · ` : "") + "Every Saturday, Gbagada"}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 24,
              padding: "10px 28px",
              borderRadius: 999,
              background: TEAL,
              fontSize: 30,
            }}
          >
            Join us: 6:00 AM, Gbagada General Hospital
          </div>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      fonts: [
        { name: "Barlow Condensed", data: condensed, weight: 700, style: "normal" },
        { name: "Barlow", data: body, weight: 500, style: "normal" },
      ],
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
