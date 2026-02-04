# CodeNomad v2 CLI

Command-line interface for CodeNomad v2.

## Installation

```bash
npm install -g @codenomad/cli
```

## Usage

### Start the server

```bash
# Start with default settings
codenomad start

# Custom port and host
codenomad start --port 3200 --host 0.0.0.0

# Custom database path
codenomad start --db-path /path/to/codenomad.db

# Enable debug logging
codenomad start --log-level debug
```

### Get version information

```bash
codenomad info
```

### Get help

```bash
codenomad --help
codenomad start --help
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build
npm run build
```
