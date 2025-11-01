import {defineReactCompilerLoaderOption, reactCompilerLoader} from "react-compiler-webpack";

export default {
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.[mc]?[jt]sx?$/i,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'esbuild-loader',
                        options: {
                            loader: 'jsx',
                            target: 'esnext',
                            jsx: 'automatic',
                        }
                    },
                    {
                        loader: reactCompilerLoader,
                        options: defineReactCompilerLoaderOption({})
                    }
                ]
            }
        ]
    }
};