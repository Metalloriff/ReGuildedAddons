import BaseAddon from "../../lib/baseAddon";
import styles from "./styles.scss";
import { loadStyles, patchElementRenderer, React } from "@reguilded/api/lib";
import Modal from "./modal";
import { unpatchAll } from "@reguilded/api/patcher";
import ModalStack from "@reguilded/api/modalStack";

// Here we create a button with thousands of useless div wrappers for no particular reason
function Button() {
    // It looks just as bad with JSX
    return (
        <div className="TransientMenuTrigger-container TransientMenuTrigger-container-desktop GifPickerButton"
             onClick={ModalStack.push.bind(ModalStack, <Modal/>)}>
            <span className="TransientMenuTrigger-children">
                <div className="ReactionPickerButton-container ReactionsControlV2-picker SlateEditor-reactions-control">
                    <div className="SVGIcon-container ReactionPickerButton-icon">
                        <svg className="icon SVGIcon-icon icon-toolbar-emoji" viewBox="0 0 512 512" width={24} height={24}>
                            <path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm115.7 272l-176 101c-15.8 8.8-35.7-2.5-35.7-21V152c0-18.4 19.8-29.8 35.7-21l176 107c16.4 9.2 16.4 32.9 0 42z"/>
                        </svg>
                    </div>
                </div>
            </span>
        </div>
    );
}

// Export our addon
export default new class GifPicker extends BaseAddon {
    id = "GifPicker";
    name = "Gif Picker";
    
    init(reGuilded, addonManager, webpackManager) {
        // this.patchSpaghetti();
        // Patch the reactions container wrapper wrapper container wrapper
        patchElementRenderer(
            ".ChatChannelInput-container .ReactionsControlV2-container.SlateEditor-reactions-control-wrapper",
            this.id,
            "after",
            this.renderButton.bind(this)
        ).catch(this.handleError.bind(this, "Failed to patch button renderer!"));
        
        // Inject styles
        this.styles = loadStyles(this.name, styles);
        
        // Create a key-bind listener
        window.addEventListener("keydown", this.keybindListener =
                e => e.ctrlKey && e.key === "g" && ModalStack.push(<Modal/>));
    }
    
    renderButton({ props }, _, render) {
        // Ensure this instance of the component is actually the correct one out of the hundreds
        // Thanks, Guilded
        if (props.wrapperClassName !== "SlateEditor-reactions-control-wrapper") return;
        
        // Return the patched button wrapper, containing our button and the original
        return (
            <div style={{ display: "flex" }}>
                <Button/>
                
                { render(props) }
            </div>
        );
    }
    
    uninit() {
        // Unpatch our patched components
        unpatchAll(this.id);
        // De-un-inject our styles
        this.styles.destroy();
        
        // Kill our key-bind listener
        window.removeEventListener("keydown", this.keybindListener);
    }
}