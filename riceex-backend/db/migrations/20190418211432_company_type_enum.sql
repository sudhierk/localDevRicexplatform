-- +goose Up
-- +goose StatementBegin
CREATE TYPE companyType AS ENUM ('EXPORTER','IMPORTER','DISTRIBUTOR','TRADER','BANK','INSURANCE','INSPECTION','FUMIGATION','STEVEDORING','SHIPPING','CUSTOMS_BROKER');
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
SELECT 'down SQL query';
-- +goose StatementEnd
