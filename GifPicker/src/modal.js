import { getOwnerInstance, React } from "@reguilded/api/lib";
import tenor from "./tenor";
import ModalStack from "@reguilded/api/modalStack";

function Item({ media }) {
    const events = {
        onClick: e => {
            // My brain. it hurts. help me. Guilded why. why do you render the past chats. why?
            const SlateEditor = [...document.getElementsByClassName("SlateEditor-editor")]
                .find(e => e.offsetParent !== null);
            const instance = getOwnerInstance(SlateEditor);
            
            instance.props.editor.insertBlock({ type: "video", data: { src: media[0].mp4.url } });
            
            !e.shiftKey && ModalStack.pop();
        }
    };
    
    return (
        <div className="TenorGifItem" {...events}>
            <img src={media[0].tinygif.url} alt="gif"/>
        </div>
    );
}

let searchTimeout;

export default function Modal() {
    // Create some states, baby
    const [query, search] = React.useState("");
    const [results, setResults] = React.useState([]);
    const [trending, setTrending] = React.useState([]);
    const [pos, setNextPos] = React.useState(0);
    const [isFetching, setFetching] = React.useState(false);
    
    // Create a reference to the search bar
    const searchRef = React.useRef();
    
    // When the component mounts, get the trending gifs and focus the search bar
    React.useEffect(() => {
        tenor.getTrending().then(({ results, next }) => (setTrending(results), setNextPos(next)));
        
        searchRef.current && searchRef.current.focus();
    }, []);
    
    // Create some events
    const events = {
        // Simulate infinite scrolling
        handleScroll: ({ currentTarget }) => {
            // If we're already fetching or aren't at the bottom, then screw off
            if (currentTarget.scrollTop + currentTarget.getBoundingClientRect().height
                < currentTarget.scrollHeight - 100 || isFetching) return;
            
            // Set the fetching state
            setFetching(true);
            
            // Check if we should search or just get trending, then append our results
            if (query.trim().length)
                tenor.search(query, { pos }).then(({ results: nextResults, next }) =>
                    (setFetching(false), setResults([ ...results, ...nextResults ]), setNextPos(next)))
            else
                tenor.getTrending({ pos }).then(({ results: nextTrending, next }) =>
                    (setFetching(false), setTrending([ ...trending, ...nextTrending ]), setNextPos(next)));
        },
        // Self-explanatory
        handleSearch: ({ currentTarget: { value } }) => {
            clearTimeout(searchTimeout);
            
            // De-bounce by 250ms to prevent API spam while typing
            searchTimeout = setTimeout(() => {
                // Set our search value
                search(value);
                
                // Make the request and set the results
                tenor.search(value).then(({ results, next }) => (setResults(results), setNextPos(next)));
            }, 250);
        }
    };
    
    // At least these divs have a purpose
    // Now including Guilded's ugly ass design!
    return (
        <div className="Modal GifPickerModal ModalV2-container ModalV2-container-has-header">
            <div className="ModalHeaderV2-container">
                <div className="ModalHeaderV2-header-wrapper">
                    <div className="ModalHeaderV2-header">GIFs, powered by Tenor</div>
                </div>
                <div className="SVGIcon-container ModalV2CloseButton-container">
                    <svg className="icon SVGIcon-icon icon-cross-2 Button Close" onClick={ModalStack.pop.bind(ModalStack)}
                         viewBox="0 0 352 512">
                        <path fill="currentColor" d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"/>
                    </svg>
                </div>
            </div>
            <div className="StatusContext-container ModalV2-modal-content ModalV2-modal-content-scrollable"
                 style={{ padding: 0 }} onScroll={events.handleScroll}>
                <div className="GifPickerInner">
                    <input className="SearchBar"
                           ref={searchRef}
                           onChange={events.handleSearch}
                           placeholder="Search Tenor..."/>
                    
                    <div className="ItemsContainer">
                        { query.trim().length ? (
                            <React.Fragment>
                                <div className="CategoryTitle">Results</div>
                                
                                <div className="Items">
                                    { results.map((r, i) => <Item key={i} {...r}/>) }
                                </div>
                            </React.Fragment>
                        ) : (
                            <React.Fragment>
                                <div className="CategoryTitle">Trending</div>

                                <div className="Items">
                                    { trending.map((r, i) => <Item key={i} {...r}/>) }
                                </div>
                            </React.Fragment>
                        ) }
                    </div>
                </div>
            </div>
        </div>
    );
}