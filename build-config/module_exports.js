define([
    'exports',
    'readium_shared_js/globals',
    'readium_shared_js/globalsSetup',
    'readium_shared_js/helpers',
    'readium_shared_js/plugins_controller',
    'readium_shared_js/models/bookmark_data',
    'readium_shared_js/models/current_pages_info',
    'readium_shared_js/models/fixed_page_spread',
    'readium_shared_js/models/media_overlay',
    'readium_shared_js/models/metadata',
    'readium_shared_js/models/node_range_info',
    'readium_shared_js/models/package',
    'readium_shared_js/models/package_data',
    'readium_shared_js/models/page_open_request',
    'readium_shared_js/models/smil_iterator',
    'readium_shared_js/models/smil_model',
    'readium_shared_js/models/spine',
    'readium_shared_js/models/spine_item',
    'readium_shared_js/models/style',
    'readium_shared_js/models/style_collection',
    'readium_shared_js/models/switches',
    'readium_shared_js/models/trigger',
    'readium_shared_js/models/viewer_settings',
    'readium_shared_js/views/audio_player',
    'readium_shared_js/views/cfi_navigation_logic',
    'readium_shared_js/views/external_agent_support',
    'readium_shared_js/views/fixed_view',
    'readium_shared_js/views/iframe_loader',
    'readium_shared_js/views/internal_links_support',
    'readium_shared_js/views/media_overlay_data_injector',
    'readium_shared_js/views/media_overlay_element_highlighter',
    'readium_shared_js/views/one_page_view',
    'readium_shared_js/views/reader_view',
    'readium_shared_js/views/reflowable_view',
    'readium_shared_js/views/scroll_view',
], function(
    exports,
    // Top Level
    Globals,
    GlobalsSetup,
    Helpers,
    PluginsController,
    // Models
    BookmarkData,
    CurrentPagesInfo,
    FixedPageSpread,
    MediaOverlay,
    Metadata,
    NodeRangeInfo,
    Package,
    PackageData,
    PageOpenRequest,
    SmilIterator,
    SmilModel,
    Spine,
    SpineItem,
    Style,
    StyleCollection,
    Switches,
    Trigger,
    ViewerSettings,
    // Views
    AudioPlayer,
    CfiNavigationLogic,
    ExternalAgentSupport,
    FixedView,
    IframeLoader,
    InternalLinksSupport,
    MediaOverlayDataInjector,
    MediaOverlayElementHighlighter,
    OnePageView,
    ReaderView,
    ReflowableView,
    ScrollView
) {
    // Top Level
    exports.Globals = Globals;
    exports.GlobalsSetup = GlobalsSetup;
    exports.Helpers = Helpers;
    exports.PluginsController = PluginsController;

    // Models
    exports.BookmarkData = BookmarkData;
    exports.CurrentPagesInfo = CurrentPagesInfo;
    exports.FixedPageSpread = FixedPageSpread;
    exports.MediaOverlay = MediaOverlay;
    exports.Metadata = Metadata;
    exports.NodeRangeInfo = NodeRangeInfo;
    exports.Package = Package;
    exports.PackageData = PackageData;
    exports.PageOpenRequest = PageOpenRequest;
    exports.SmilIterator = SmilIterator;
    exports.SmilModel = SmilModel;
    exports.Spine = Spine;
    exports.SpineItem = SpineItem;
    exports.Style = Style;
    exports.StyleCollection = StyleCollection;
    exports.Switches = Switches;
    exports.Trigger = Trigger;
    exports.ViewerSettings = ViewerSettings;

    // Views
    exports.AudioPlayer = AudioPlayer;
    exports.CfiNavigationLogic = CfiNavigationLogic;
    exports.ExternalAgentSupport = ExternalAgentSupport;
    exports.FixedView = FixedView;
    exports.IframeLoader = IframeLoader;
    exports.InternalLinksSupport = InternalLinksSupport;
    exports.MediaOverlayDataInjector = MediaOverlayDataInjector;
    exports.MediaOverlayElementHighlighter = MediaOverlayElementHighlighter;
    exports.OnePageView = OnePageView;
    exports.ReaderView = ReaderView;
    exports.ReflowableView = ReflowableView;
    exports.ScrollView = ScrollView;
});