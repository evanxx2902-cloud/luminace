.PHONY: proto generate build

PROTO_DIR := ../api/proto/v1
KRATOS_THIRD_PARTY := $(shell go env GOPATH)/pkg/mod/github.com/go-kratos/kratos/v2@v2.9.2/third_party

proto:
	mkdir -p api/luminance/v1
	protoc \
		--proto_path=$(PROTO_DIR) \
		--proto_path=$(KRATOS_THIRD_PARTY) \
		--go_out=paths=source_relative:./api/luminance/v1 \
		--go-grpc_out=paths=source_relative:./api/luminance/v1 \
		--grpc-gateway_out=paths=source_relative:./api/luminance/v1 \
		--grpc-gateway_opt=generate_unbound_methods=true \
		$(PROTO_DIR)/*.proto

generate:
	go run entgo.io/ent/cmd/ent generate ./ent/schema

build:
	CGO_ENABLED=0 GOOS=linux go build -o luminance-api ./cmd/luminance-api
	CGO_ENABLED=0 GOOS=linux go build -o luminance-migrate ./cmd/migrate
