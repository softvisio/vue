import env from "#core/env";
import webpack from "webpack";
import { VueLoaderPlugin } from "vue-loader";
import HTMLPlugin from "html-webpack-plugin";
import CopyPlugin from "copy-webpack-plugin";
import TerserPlugin from "terser-webpack-plugin";
import CaseSensitivePathsPlugin from "case-sensitive-paths-webpack-plugin";
import MiniCSSExtractPlugin from "mini-css-extract-plugin";
import CSSMinimizerPlugin from "css-minimizer-webpack-plugin";
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";
import autoprefixer from "autoprefixer";

const DefinePlugin = webpack.DefinePlugin;

const app = {
    "name": "vue-app",
    "mode": process.env.WEBPACK_MODE,
    "context": process.env.WEBPACK_CONTEXT,
    "devtool": "eval",

    "output": {
        "path": process.env.WEBPACK_OUTPUT_PATH,
        "filename": "js/[name].js",
        "publicPath": "auto",
        "chunkFilename": "js/[name].js",
    },

    "experiments": {
        "topLevelAwait": true,
    },

    "entry": {
        "app": "./src/main.js",
    },

    "cache": { "type": "filesystem" },

    "module": {
        "rules": [

            // esm
            {
                "test": /\.m?jsx?$/,
                "resolve": {
                    "fullySpecified": false,
                },
            },

            // js
            {
                "test": /\.m?jsx?$/,
                "exclude": [/node_modules/],
                "use": ["thread-loader", "babel-loader"],
            },

            // vue
            {
                "test": /\.vue$/,
                "use": [
                    {
                        "loader": "vue-loader",
                        "options": {
                            "babelParserPlugins": ["jsx", "classProperties", "decorators-legacy"],
                            "compilerOptions": {
                                "isCustomElement": tag => tag.startsWith( "ext-" ),
                            },
                        },
                    },
                ],
            },

            // vue-style
            {
                "test": /\.vue$/,
                "resourceQuery": /type=style/,
                "sideEffects": true,
            },

            // images
            {
                "test": /\.(png|jpe?g|gif|webp|avif)(\?.*)?$/,
                "type": "asset/resource",
                "generator": {
                    "filename": "img/[name].[hash:8][ext][query]",
                },
            },

            // svg
            {
                "test": /\.(svg)(\?.*)?$/,
                "type": "asset/resource",
                "generator": {
                    "filename": "img/[name].[hash:8][ext][query]",
                },
            },

            // media
            {
                "test": /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
                "type": "asset/resource",
                "generator": {
                    "filename": "media/[name].[hash:8][ext][query]",
                },
            },

            // fonts
            {
                "test": /\.(woff2?|eot|ttf|otf)(\?.*)?$/i,
                "type": "asset/resource",
                "generator": {
                    "filename": "fonts/[name].[hash:8][ext][query]",
                },
            },

            // css
            {
                "test": /\.css$/,
                "use": [
                    {
                        "loader": "vue-style-loader",
                        "options": {
                            "sourceMap": false,
                            "shadowMode": false,
                        },
                    },

                    // MiniCSSExtractPlugin.loader,
                    {
                        "loader": "css-loader",
                        "options": {
                            "sourceMap": false,
                            "importLoaders": 2,
                        },
                    },
                    {
                        "loader": "postcss-loader",
                        "options": {
                            "sourceMap": false,
                            "postcssOptions": {
                                "plugins": [autoprefixer()],
                            },
                        },
                    },
                ],
            },
        ],
    },

    "optimization": {
        "realContentHash": false,

        "splitChunks": {
            "cacheGroups": {
                "defaultVendors": {
                    "name": "chunk-vendors",
                    "test": /[\\/]node_modules[\\/]/,
                    "priority": -10,
                    "chunks": "initial",
                },
                "common": {
                    "name": "chunk-common",
                    "minChunks": 2,
                    "priority": -20,
                    "chunks": "initial",
                    "reuseExistingChunk": true,
                },
            },
        },

        "minimizer": [
            new TerserPlugin( JSON.parse( process.env.WEBPACK_TERSER_OPTIONS ) ),

            new CSSMinimizerPlugin( {
                "parallel": true,
                "minimizerOptions": {
                    "preset": [
                        "default",
                        {
                            "mergeLonghand": false,
                            "cssDeclarationSorter": false,
                        },
                    ],
                },
            } ),
        ],
    },

    "plugins": [
        new VueLoaderPlugin(),

        new MiniCSSExtractPlugin( {
            "filename": "css/[name].[contenthash:8].css",
            "chunkFilename": "css/[name].[contenthash:8].css",
        } ),

        new CaseSensitivePathsPlugin(),

        new DefinePlugin( {
            "__VUE_OPTIONS_API__": "true",
            "__VUE_PROD_DEVTOOLS__": "false",
        } ),

        new DefinePlugin( {
            "process.env": process.env.WEBPACK_ENV,
        } ),

        new HTMLPlugin( {
            "title": "rankrocket-ui",
            "scriptLoading": "defer",
            "template": "public/index.html",
            "templateParameters": JSON.parse( process.env.WEBPACK_ENV ),
        } ),

        new CopyPlugin( {
            "patterns": [
                {
                    "from": "public",
                    "globOptions": {
                        "ignore": ["**/index.html"],
                    },
                },
            ],
        } ),

        new BundleAnalyzerPlugin( {
            "analyzerMode": env.isProduction ? "static" : "server",
            "analyzerPort": 8888,
            "openAnalyzer": false,
        } ),
    ],

    "resolve": {
        "alias": {
            ...JSON.parse( process.env.WEBPACK_RESOLVE_ALIAS ),
            "vue$": "vue/dist/vue.runtime.esm-bundler.js",
            "#vue": "@softvisio/vue",
            "#ext$": "@softvisio/ext/ext-" + process.env.EXT_VERSION,
            "#ext": "@softvisio/ext/resources/ext-" + process.env.EXT_VERSION,
            "#ewc$": "@softvisio/ext/ewc-" + process.env.EWC_VERSION,
            "#ewc": "@softvisio/ext/resources/ewc-" + process.env.EWC_VERSION,
        },

        // required by froala, can be replaced with crypto-browserify
        "fallback": {
            "crypto": false,
        },

        "extensions": [".mjs", ".js", ".jsx", ".vue", ".json", ".wasm"],

        "modules": JSON.parse( process.env.WEBPACK_RESOLVE_MODULES ),
    },

    "resolveLoader": { "modules": JSON.parse( process.env.WEBPACK_RESOLVE_LOADER_MODULES ) },
};

export default app;
