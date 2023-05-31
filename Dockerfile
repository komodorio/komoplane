# Stage - frontend
FROM node:latest as frontend

WORKDIR /build

COPY ./pkg/frontend ./pkg/frontend

WORKDIR /build/pkg/frontend

RUN npm i && npm run build

# Stage - builder
FROM golang as builder

ENV GOOS=linux
ENV GOARCH=amd64
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

RUN make build

# Stage - runner
FROM alpine
EXPOSE 8080

COPY --from=builder /build/bin/komoplane /bin/komoplane

ENTRYPOINT ["/bin/komoplane", "--bind=0.0.0.0", "--port=8090"]

# docker build . -t komodorio/komoplane:0.0.0 && kind load docker-image komodorio/komoplane:0.0.0