import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Fade from "@mui/material/Fade";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";

export function AboutPage() {
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  return (
    <Container component="main" maxWidth="sm">
      <Box sx={{ py: 8, px: 3 }}>
        <Fade in timeout={reduceMotion ? 0 : 400}>
          <Stack spacing={{ xs: 3, sm: 4 }}>
            <Typography variant="h5" component="h1" gutterBottom>
              About AAC Board AI
            </Typography>

            <Typography variant="body1" component="p">
              AAC Board AI helps people who can’t rely on speech communicate
              faster and more naturally.
            </Typography>

            <Typography variant="body1" component="p">
              AI corrects grammar, adjusts tone, and translates — all on your
              device. Private. Offline. Free.
            </Typography>

            <Typography variant="body1" component="p">
              Powered by Chrome’s built-in Gemini Nano for people with cerebral
              palsy, autism, aphasia, and the therapists who support them.
            </Typography>

            <Typography variant="h6" component="h2" sx={{ pt: 2 }}>
              Acknowledgments
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              component="p"
              sx={{
                "& a": {
                  color: "primary.main",
                  textDecorationColor: "currentColor",
                  textUnderlineOffset: 4,
                  textDecorationThickness: "from-font",
                },
                "& em": { fontStyle: "italic" },
              }}
            >
              Created for the{" "}
              <Link
                href="https://developer.chrome.com/blog/ai-challenge-2025"
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
              >
                Google Chrome Built-in AI Challenge 2025
              </Link>
              , built on the{" "}
              <Link
                href="https://www.openboardformat.org/"
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
              >
                Open Board Format
              </Link>
              , and featuring the <em>Quick Core 24</em> board by{" "}
              <Link
                href="https://www.openaac.org"
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
              >
                OpenAAC
              </Link>
              .
            </Typography>
          </Stack>
        </Fade>
      </Box>
    </Container>
  );
}
