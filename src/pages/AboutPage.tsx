import { usePageTitle } from "@app/usePageTitle";
import GitHubIcon from "@mui/icons-material/GitHub";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Fade from "@mui/material/Fade";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useEffect } from "react";

const FADE_DURATION_MS = 400;

function AboutPage() {
  const prefersReducedMotion = useMediaQuery(
    "(prefers-reduced-motion: reduce)",
  );

  const { setPageTitle } = usePageTitle();

  useEffect(() => {
    setPageTitle("About");
  }, [setPageTitle]);

  return (
    <Container component="main" maxWidth="sm" sx={{ py: 6 }}>
      <Fade in timeout={prefersReducedMotion ? 0 : FADE_DURATION_MS}>
        <Stack spacing={{ xs: 3, sm: 4 }}>
          <Typography variant="body1" component="p">
            AAC Board AI helps people who can't rely on speech communicate more
            easily and naturally. It uses on-device AI to correct grammar,
            adjust tone, and translate messages, keeping interactions private
            and fast.
          </Typography>

          <Typography variant="h6" component="h2" sx={{ pt: 2 }}>
            Acknowledgments
          </Typography>

          <Typography
            variant="body2"
            component="p"
            color="text.secondary"
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
            Winner of the{" "}
            <Link
              href="https://developer.chrome.com/blog/ai-challenge-winners-2025/"
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
            >
              Google Chrome Built-in AI Challenge 2025
            </Link>
            . Built on the{" "}
            <Link
              href="https://www.openboardformat.org/"
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
            >
              Open Board Format
            </Link>{" "}
            and featuring the <em>Quick Core 24</em> vocabulary set by{" "}
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

          <Typography variant="h6" component="h2" sx={{ pt: 2 }}>
            Open Source
          </Typography>

          <Button
            variant="text"
            startIcon={<GitHubIcon />}
            href="https://github.com/shayc/aac-board-ai"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ alignSelf: "flex-start" }}
          >
            View Source Code on GitHub
          </Button>
        </Stack>
      </Fade>
    </Container>
  );
}

export default AboutPage;
