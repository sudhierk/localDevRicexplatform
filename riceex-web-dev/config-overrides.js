const {override, fixBabelImports, addLessLoader} = require('customize-cra');

module.exports = override(
    fixBabelImports('import', {
        libraryName: 'antd',
        libraryDirectory: 'es',
        style: true,
    }),
    addLessLoader({
        javascriptEnabled: true,
        modifyVars: {
            '@primary-color': '#0065AB',
            '@table-header-bg': '#FFF',
            '@table-row-hover-bg': '#F1F3F5',
            '@heading-color': '#354052',
            '@text-color': '#354052'
        },
    }),
);
