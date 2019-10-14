-- +goose Up
-- +goose StatementBegin
UPDATE companies SET company_type=upper(company_type);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
SELECT 'down SQL query';
-- +goose StatementEnd
