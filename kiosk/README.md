# DJ’s Click Windows printing setup

1. Install your USB printer’s Windows driver and Google Chrome.
2. Run **1-setup-printer.cmd**. This opens a separate booth browser profile, preserving your normal Chrome profile. First edit booth-url.txt to your Render website URL. Sign in using the server admin password.
3. Allow camera access and pop-ups for the booth site. Open Operator with PIN **011623**, then Event setup → Print layout test. In Chrome’s print preview select the actual USB printer, matching paper size, 100% scale, no headers/footers and correct margins. Print a real test sheet. Chrome remembers destination/settings in this booth profile.
4. Check the physical print. Close every Chrome window from this booth profile before launching silent mode; an already-running process may ignore new command-line flags.
5. Run **2-start-silent-booth.cmd**. Enable **Automatically print when the guest finishes** in Operator settings. Finish & print requests printing after customer approval. Chrome’s `--kiosk-printing` flag automatically accepts print preview using the selected/default destination. Verify that it still targets your printer with another real test.
6. Use F11 to leave fullscreen, or Alt+F4 to close the booth. Keep this profile dedicated to the booth. Reopen the setup launcher when changing printer or paper. The website cannot confirm physical job completion, paper, ink, cuts or printer errors.

This does not install a service or change system printer settings. The launcher creates `kiosk-profile/` beside these files on first use. That profile contains your booth sign-in, settings and gallery; keep it private, and use the automatic backup folder. Moving to this profile starts a separate gallery: download a complete event backup from your previous browser and restore it here.

Primary reference: [Chromium print-preview implementation](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/chrome/browser/ui/webui/print_preview/print_preview_handler.cc). Hardware printing remains unverified until you run the test on your printer.
