import { EditVideoDetails } from "./EditVideoDetails.js";
import { SaveVideo } from "./SaveVideo.js";

(async () => {
    const vid = '-leSh7zUV1E'

    console.log({vid})

    const editor = new EditVideoDetails(vid)

    await editor.makeChanges()

})();
