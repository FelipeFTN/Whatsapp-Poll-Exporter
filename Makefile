VERSION  := 2.0
DIST     := dist

# Files bundled into every package
SOURCES := \
	popup.html popup.js \
	script.js moduleraid.js \
	translations.js make_xlsx_global.js \
	xlsx.full.min.js libphonenumber-js.min.js \
	icons/icon16.png icons/icon24.png icons/icon32.png \
	icons/icon48.png icons/icon64.png icons/icon128.png

.PHONY: all chrome firefox edge clean help

all: chrome firefox

chrome: $(DIST)/chrome-v$(VERSION).zip

firefox: $(DIST)/firefox-v$(VERSION).zip

edge: chrome
	@cp $(DIST)/chrome-v$(VERSION).zip $(DIST)/edge-v$(VERSION).zip
	@echo "Edge package (identical to Chrome): $(DIST)/edge-v$(VERSION).zip"

$(DIST)/chrome-v$(VERSION).zip: manifest.json $(SOURCES)
	@mkdir -p $(DIST)
	@echo "→ Building Chrome/Edge extension..."
	@zip -qr $@ manifest.json $(SOURCES)
	@echo "  Done: $@  ($$(du -sh $@ | cut -f1))"

$(DIST)/firefox-v$(VERSION).zip: manifest.firefox.json $(SOURCES)
	@mkdir -p $(DIST)
	@echo "→ Building Firefox extension..."
	@# Swap in the Firefox manifest for packaging, then restore
	@cp manifest.json manifest.json.bak
	@cp manifest.firefox.json manifest.json
	@zip -qr $@ manifest.json $(SOURCES)
	@mv manifest.json.bak manifest.json
	@echo "  Done: $@  ($$(du -sh $@ | cut -f1))"

clean:
	@echo "→ Cleaning build artifacts..."
	@rm -rf $(DIST)
	@echo "  Done."

help:
	@echo ""
	@echo "  WhatsApp Poll Exporter v$(VERSION)"
	@echo ""
	@echo "  Usage: make [target]"
	@echo ""
	@echo "  Targets:"
	@echo "    all      Build Chrome and Firefox packages (default)"
	@echo "    chrome   Build Chrome/Edge .zip"
	@echo "    firefox  Build Firefox .zip"
	@echo "    edge     Alias for chrome (same package)"
	@echo "    clean    Remove dist/"
	@echo "    help     Show this message"
	@echo ""
