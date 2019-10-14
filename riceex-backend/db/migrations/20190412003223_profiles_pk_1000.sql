-- +goose Up
-- +goose StatementBegin
SELECT 'up SQL query';
ALTER SEQUENCE user_profiles_id_seq RESTART WITH 1000;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
SELECT 'down SQL query';
-- +goose StatementEnd
