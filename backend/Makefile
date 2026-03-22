.PHONY: proto generate build

proto:
	mkdir -p api/luminance/v1
	protoc \
		--proto_path=../api/proto/v1 \
		--proto_path=../third_party \
		--proto_path=/usr/include \
		--go_out=paths=source_relative:./api/luminance/v1 \
		--go-grpc_out=paths=source_relative:./api/luminance/v1 \
		--grpc-gateway_out=paths=source_relative:./api/luminance/v1 \
		--grpc-gateway_opt=generate_unbound_methods=true \
		../api/proto/v1/*.proto

generate:
	go run entgo.io/ent/cmd/ent generate ./ent/schema

build:
	CGO_ENABLED=0 GOOS=linux go build -o luminance-api ./cmd/luminance-api
	CGO_ENABLED=0 GOOS=linux go build -o luminance-migrate ./cmd/migrate
