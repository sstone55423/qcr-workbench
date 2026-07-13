# QCR Workbench

A multipage Streamlit application for quantitative cyber risk analysis at the fictional **Stella Polaris Medical Components**. It uses FAIR-style decomposition, bounded three-point estimates, Monte Carlo simulation, treatment economics, and an executive Markdown report.

The bundled scenarios and values are illustrative. They are not benchmarks and should be replaced or calibrated with organizational evidence before making decisions.

## Features

- Scenario scoping with clear asset, threat, effect, and owner definitions
- FAIR decomposition into frequency and magnitude factors
- Editable minimum / most-likely / maximum assumptions
- Deterministic annualized loss expectancy with a calculation trace
- Seeded Monte Carlo annual-loss distribution and exceedance curve
- Baseline-versus-residual treatment comparison and return on control
- Executive report preview and Markdown download
- Sidebar light/dark toggle with four configurable palettes for each mode
- Shadcn-styled summary cards for key FAIR and loss metrics
- Example ransomware, business email compromise, cloud document exposure, third-party logistics outage, and shadow AI scenarios

Risk mathematics is contained in `qcr_core`; the Streamlit files are thin presentation and session-state layers.

## Project structure

```text
qcr-workbench/
├── app.py                         # Streamlit landing page
├── pages/                         # Multipage Streamlit UI
├── qcr_core/
│   ├── models.py                  # Typed domain objects
│   ├── scenarios.py               # Scenario loading
│   ├── fair.py                    # FAIR decomposition and ALE
│   ├── estimates.py               # Modified PERT estimates
│   ├── simulation.py              # Monte Carlo model
│   ├── treatments.py              # Residual-risk economics
│   └── reporting.py               # UI-independent report generation
├── data/stella_polaris_scenarios.json
├── tests/
└── pyproject.toml
```

## Setup

Python 3.10 or later is required. From the project directory:

### Windows PowerShell

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -e ".[dev]"
```

### macOS or Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e ".[dev]"
```

## Run

```bash
streamlit run app.py
```

Streamlit displays a local URL, normally `http://localhost:8501`. Use the sidebar to move through the workflow. The active scenario, edited assumptions, latest simulation, and treatment comparison persist in Streamlit session state.

## Test

```bash
pytest
```

## Modeling notes

- Three-point inputs use a modified PERT distribution with shape parameter 4.
- Deterministic values use the corresponding PERT means.
- Loss event frequency is threat event frequency multiplied by vulnerability.
- Simulation draws annual event counts from a Poisson distribution.
- Each simulated loss event includes primary loss and may include secondary loss according to the sampled secondary-loss probability.
- Treatment reductions are proportional changes to selected FAIR factors.
- Return on control is `(risk reduction - annual control cost) / annual control cost`.

The model intentionally favors transparency and workshop usability. Before production use, document data provenance, validate independence and distribution assumptions, and consider correlation, control uncertainty, insurance, multi-year cash flows, and scenario aggregation.
