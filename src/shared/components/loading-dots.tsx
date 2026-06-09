import Box from "@mui/material/Box";

export function LoadingDots() {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 1,
        "& span": {
          width: "12px",
          height: "12px",
          backgroundColor: "primary.main",
          borderRadius: "50%",
          animation: "loading-dots 1.4s ease-in-out infinite",
        },
        "& span:nth-of-type(1)": { animationDelay: "-0.32s" },
        "& span:nth-of-type(2)": { animationDelay: "-0.16s" },
        "@keyframes loading-dots": {
          "0%, 80%, 100%": { transform: "scale(0)" },
          "40%": { transform: "scale(1)" },
        },
      }}
    >
      <span />
      <span />
      <span />
    </Box>
  );
}
