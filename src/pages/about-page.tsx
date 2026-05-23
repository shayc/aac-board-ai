import { APP_NAME } from "@app/app-info";
import GitHubIcon from "@mui/icons-material/GitHub";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PageContainer } from "@app/layouts/page-container";
import { PageTitle } from "@app/layouts/page-title";
import { m } from "@paraglide/messages.js";

export const Component = function AboutPage() {
  return (
    <PageContainer>
      <PageTitle>{m.aboutHeading()}</PageTitle>
      <Stack spacing={{ xs: 3, sm: 4 }}>
        <Typography component="p" variant="body1">
          {m.aboutAppDescription({ appName: APP_NAME })}
        </Typography>

        <Typography component="h2" variant="h6" sx={{ pt: 2 }}>
          {m.aboutAcknowledgmentsHeading()}
        </Typography>

        <Typography
          component="p"
          variant="body2"
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
          {m.aboutWinnerOfChallengePrefix()}
          <Link
            href="https://developer.chrome.com/blog/ai-challenge-winners-2025/"
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
          >
            {m.aboutWinnerOfChallengeLink()}
          </Link>
          {m.aboutBuiltOnObfPrefix()}
          <Link
            href="https://www.openboardformat.org/"
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
          >
            {m.aboutBuiltOnObfLink()}
          </Link>
          {m.aboutFeaturingQuickCore()}
          <Link
            href="https://www.openaac.org"
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
          >
            {m.aboutOpenAacLinkText()}
          </Link>
          .
        </Typography>

        <Typography variant="h6" component="h2" sx={{ pt: 2 }}>
          {m.aboutOpenSourceHeading()}
        </Typography>

        <Button
          variant="text"
          startIcon={<GitHubIcon />}
          href="https://github.com/shayc/aac-board-ai"
          target="_blank"
          rel="noopener noreferrer"
          sx={{ alignSelf: "flex-start" }}
        >
          {m.aboutViewSource()}
        </Button>
      </Stack>
    </PageContainer>
  );
};
