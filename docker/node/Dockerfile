ARG PLAYWRIGHT_VERSION
FROM mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble

ARG UID=1000
ARG GID=1000
RUN mkdir -p /app/node_modules && chown ${UID}:${GID} /app/node_modules
WORKDIR /app
