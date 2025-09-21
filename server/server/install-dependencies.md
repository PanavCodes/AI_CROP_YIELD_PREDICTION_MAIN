# Backend Dependencies for CSV-to-AI Pipeline

## Install Required Packages

```bash
# Core database and ML packages
npm install duckdb multer csv-parser
npm install @tensorflow/tfjs-node  # For AI/ML
npm install ml-regression         # Simple ML algorithms
npm install fast-csv             # CSV processing
npm install joi                  # Data validation

# Development utilities
npm install --save-dev @types/multer
```

## Package Purposes

- **duckdb**: High-performance analytical database for crop data storage
- **multer**: File upload middleware for CSV files
- **csv-parser/fast-csv**: CSV file parsing and processing
- **ml-regression**: Simple ML models (Linear/Polynomial regression)
- **@tensorflow/tfjs-node**: Advanced ML capabilities if needed
- **joi**: Data validation and schema enforcement

## DuckDB Benefits for Agriculture Data
- Extremely fast analytical queries
- Handles large datasets efficiently
- File-based (no server setup needed)
- Perfect for time-series crop data
- Built-in aggregation functions for yield analysis