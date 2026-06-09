import Box from "@mui/material/Box";

export function DotsProgress() {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 1,
        "& span": {
          width: 8,
          height: 8,
          backgroundColor: "text.primary",
          borderRadius: "50%",
          animation: "dots-progress 1.4s ease-in-out infinite",
        },
        "& span:nth-of-type(1)": { animationDelay: "-0.32s" },
        "& span:nth-of-type(2)": { animationDelay: "-0.16s" },
        "@keyframes dots-progress": {
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
