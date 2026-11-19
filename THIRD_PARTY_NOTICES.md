# Third-party notices

The site bundles Cormorant Garamond and Inter fonts from Fontsource. Both use the SIL Open Font License 1.1. Their copyright notices and full license texts ship with the static build at `/licenses/cormorant-garamond-OFL.txt` and `/licenses/inter-OFL.txt`.

The application uses React and React DOM (Meta Platforms, Inc. and affiliates), Framer Motion (Framer B.V. and Motion's contributors), and Lucide (Lucide contributors, ISC license). See the exact pinned versions and dependency tree in `package.json` and `package-lock.json`, and the license files distributed with those npm packages. Build tooling is not needed by the deployed static site.

The build collects full upstream production license/copyright/notice files into
`dist/licenses/third-party-software.txt`, distributed at `/licenses/third-party-software.txt`.
It fails if a production dependency has no license text. Runtime packages use MIT, ISC,
0BSD, and OFL-1.1 licenses. No remotely hosted font or script is loaded.

Build-only exceptions: Lightning CSS is MPL-2.0 (commercially usable file copyleft, not a
permissive license); caniuse-lite compatibility data is CC-BY-4.0; argparse is Python-2.0.
They are explicit in the license baseline gate. The Nginx runtime contains only generated
site files; these build tools are not browser libraries. Preserve their notices and review
source/attribution obligations if modifying or distributing the toolchain/build stages.

Photographs are local portfolio assets, including the user-supplied Holiday botanicals
image. The repository does not establish complete ownership, client consent or commercial
rights for every photo/design/character. The owner must confirm and retain those permissions.
No missing asset-provenance file should be treated as proof of ownership.
