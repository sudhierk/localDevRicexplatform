-- +goose Up
-- +goose StatementBegin
ALTER TABLE companies ALTER COLUMN company_type TYPE companyType using company_type::companyType;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
SELECT 'down SQL query';
-- +goose StatementEnd
