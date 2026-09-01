#!/usr/bin/env bash
# Build the whitepaper PDF from Markdown.
#
# The deposited PDF was previously produced by an unrecorded, hand-run pandoc
# invocation, which meant it could not be regenerated reliably -- and it was
# built with fonts that silently dropped every box-drawing character in the
# section 4 architecture diagram (1186 missing glyphs). This script exists so
# the artifact is reproducible and so that defect cannot recur.
#
# Requires: pandoc, lualatex (MiKTeX or TeX Live), and the DejaVu fonts.
#
# Usage:  bash docs/build-pdf.sh

set -euo pipefail

cd "$(dirname "$0")"

SRC="whitepaper-zero-custody.md"
OUT="whitepaper-zero-custody.pdf"

# Fonts:
#   mainfont        Latin Modern Roman -- the standard LaTeX book face.
#   mainfontfallback DejaVu Serif -- supplies glyphs Latin Modern lacks (U+2248).
#   monofont        DejaVu Sans Mono -- has full box-drawing coverage, which
#                   Latin Modern Mono does not. This is what makes the
#                   architecture diagram render at all.
pandoc "$SRC" -o "$OUT" \
  --pdf-engine=lualatex \
  -V geometry:margin=1in \
  -V mainfont="Latin Modern Roman" \
  -V mainfontfallback="DejaVu Serif:" \
  -V monofont="DejaVu Sans Mono" \
  -V monofontoptions="Scale=0.82" \
  -V colorlinks=true \
  -V linkcolor=black \
  -V urlcolor=[HTML]{1A4F8F} \
  -V papersize=letter \
  2>&1 | tee build.log

# Any missing glyph is a build failure, not a warning. A dropped character is
# invisible in the output -- which is exactly how the diagram broke before.
if grep -qi "missing character" build.log; then
  echo "ERROR: lualatex reported missing characters. The PDF is incomplete." >&2
  grep -i "missing character" build.log | sort -u >&2
  rm -f build.log
  exit 1
fi

rm -f build.log
echo "Built $OUT"
