-- +goose Up
-- +goose StatementBegin
DELETE FROM cities T1
USING   cities T2
WHERE   T1.id > T2.id
        AND T1.country = T2.country
        AND T1.city = T2.city;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
SELECT 'down SQL query';
-- +goose StatementEnd
