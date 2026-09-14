ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))

.PHONY: check publish

# Run the full repository check (format, typecheck, test).
check:
	npm run check

# Publish a plugin to npm via GitHub Actions OIDC.
#
#   make publish PACKAGE=opencode-intercom               # patch bump
#   make publish PACKAGE=opencode-intercom VERSION=0.2.0 # explicit version
#
# Bumps the version, runs checks, commits, pushes to main, and creates a
# GitHub Release whose tag triggers the OIDC publish workflow. The package
# must already exist on npm with a trusted publisher configured.
publish:
	@./scripts/publish.sh "$(PACKAGE)" "$(VERSION)"
