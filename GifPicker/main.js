const { Patcher, getOwnerInstance, findInTree, waitForElement, createDomElement, loadStyles } = require("./lib.js");
const TenorClient = require("./tenor");
const Modal = require("./modal");
const Modules = require("./modules");

function Button() {
    const { React } = Modules;
    
    // Let's play a game of "how many useless div wrappers can we fit around an element?" ~Guilded
    return React.createElement(
        "div",
        {
            className: "TransientMenuTrigger-container TransientMenuTrigger-container-desktop GifPickerButton",
            onClick: Modal.open.bind(Modal)
        },
        React.createElement(
            "span",
            { className: "TransientMenuTrigger-children" },
            React.createElement(
                "div",
                { className: "ReactionPickerButton-container ReactionsControlV2-picker SlateEditor-reactions-control" },
                React.createElement(
                    "div",
                    { className: "SVGIcon-container ReactionPickerButton-icon" },
                    React.createElement(
                        "svg",
                        { className: "icon SVGIcon-icon icon-toolbar-emoji", viewBox: "0 0 512 512", width: 24, height: 24 },
                        React.createElement(
                            "path",
                            {
                                d: "M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm115.7 272l-176 101c-15.8 8.8-35.7-2.5-35.7-21V152c0-18.4 19.8-29.8 35.7-21l176 107c16.4 9.2 16.4 32.9 0 42z"
                            }
                        )
                    )
                )
            )
        )
    );
}

module.exports = new class GifPicker {
    id = "GifPicker";
    name = "GIF Picker";
    
    preinit(reGuilded, addonManager) { }
    
    init(reGuilded, addonManager, _) {
        Modules.init(_);
        
        // Fuck off
        window.__SENTRY__.hub.getClient().close(0);
        window.__SENTRY__.logger.disable();
        
        this.patchSpaghetti(_);
        this.patchSlateEditor().catch(console.error.bind(console, "Failed to patch slate editor"));
        this.createModalContainer();
        
        this.styles = loadStyles(this.name, "styles.css");
    }
    
    patchSpaghetti(_) {
        const module = Object.values(_._webpackExports).find(m => m?.exports?.default?.IsWhitelistedUrl);
        const spaget = ["isThirdPartyAnimatedImage", "IsWhitelistedUrl", "IsGifUrl"];
        
        for (const moduleName of spaget)
            Patcher.instead(this.name, module.exports.default, moduleName, (_, [url], original) =>
                url?.includes("tenor.com") || original(url));
    }
    
    async patchSlateEditor() {
        const { React } = Modules;
        const node = await waitForElement(".ReactionsControlV2-container.SlateEditor-reactions-control-wrapper");
        const instance = getOwnerInstance(node);
        
        const components = [instance.constructor.prototype, instance];
        
        for (const component of components) {
            Patcher.after(this.name, component, "render", (scope, _, component) => {
                component.props.children = React.createElement(
                    "div",
                    { style: { display: "inline-flex" } },
                    [
                        React.createElement(Button),
                        component.props.children
                    ]
                );

                return component;
            });
        }
        
        instance.forceUpdate();
    }
    
    createModalContainer() {
        const { React, ReactDOM } = Modules;
        const container = createDomElement(
            "div",
            { className: "ModalContainer", id: "ModalContainer" }
        );
        
        document.body.appendChild(container);
        ReactDOM.render(React.createElement(Modal.Wrapper), container);
    }
    
    uninit() {
        const { ReactDOM } = Modules;
        
        Patcher.unpatchAll(this.name);
        this.styles?.destroy?.();
        
        ReactDOM.unmountComponentAtNode(document.getElementById("ModalContainer"));
    }
};