# Stage - frontend
# TODO: remove version pin when they fix the regression https://github.com/nodejs/node/pull/49500
FROM node:20.5 as frontend

WORKDIR /build

COPY ./pkg/frontend ./pkg/frontend

WORKDIR /build/pkg/frontend

RUN npm i && npm run build

# Stage - builder
FROM --platform=${BUILDPLATFORM:-linux/amd64} golang as builder

ARG TARGETPLATFORM
ARG BUILDPLATFORM
ARG TARGETOS
ARG TARGETARCH

ENV GOOS=${TARGETOS:-linux}
ENV GOARCH=${TARGETARCH:-amd64}
ENV CGO_ENABLED=0

WORKDIR /build

COPY --from=frontend /build/pkg/frontend/dist /build/pkg/frontend/dist


COPY go.mod ./
COPY go.sum ./
COPY main.go ./
RUN go mod download

ARG VER=0.0.0
ENV VERSION=${VER}

ADD Makefile ./
ADD ./pkg/backend ./pkg/backend
ADD ./pkg/frontend/fs.go ./pkg/frontend

RUN make build_go

# Stage - runner
FROM --platform=${TARGETPLATFORM:-linux/amd64} alpine

ARG TARGETPLATFORM
ARG BUILDPLATFORM

EXPOSE 8090

COPY --from=builder /build/bin/komoplane /bin/komoplane

ENTRYPOINT ["/bin/komoplane", "--bind=0.0.0.0", "--port=8090"]

# docker build . -t komodorio/komoplane:0.0.0 && kind load docker-image komodorio/komoplane:0.0.0