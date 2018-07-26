import Globals from "readium_shared_js/globals";
import GlobalsSetup from "readium_shared_js/globalsSetup";
import Helpers from "readium_shared_js/helpers";
import PluginsController from "readium_shared_js/plugins_controller";
import BookmarkData from "readium_shared_js/models/bookmark_data";
import CurrentPagesInfo from "readium_shared_js/models/current_pages_info";
import FixedPageSpread from "readium_shared_js/models/fixed_page_spread";
import MediaOverlay from "readium_shared_js/models/media_overlay";
import Metadata from "readium_shared_js/models/metadata";
import NodeRangeInfo from "readium_shared_js/models/node_range_info";
import Package from "readium_shared_js/models/package";
import PackageData from "readium_shared_js/models/package_data";
import PageOpenRequest from "readium_shared_js/models/page_open_request";
import SmilIterator from "readium_shared_js/models/smil_iterator";
import SmilModel from "readium_shared_js/models/smil_model";
import Spine from "readium_shared_js/models/spine";
import SpineItem from "readium_shared_js/models/spine_item";
import Style from "readium_shared_js/models/style";
import StyleCollection from "readium_shared_js/models/style_collection";
import Switches from "readium_shared_js/models/switches";
import Trigger from "readium_shared_js/models/trigger";
import ViewerSettings from "readium_shared_js/models/viewer_settings";
import AudioPlayer from "readium_shared_js/views/audio_player";
import CfiNavigationLogic from "readium_shared_js/views/cfi_navigation_logic";
import ExternalAgentSupport from "readium_shared_js/views/external_agent_support";
import FixedView from "readium_shared_js/views/fixed_view";
import IframeLoader from "readium_shared_js/views/iframe_loader";
import InternalLinksSupport from "readium_shared_js/views/internal_links_support";
import MediaOverlayDataInjector from "readium_shared_js/views/media_overlay_data_injector";
import MediaOverlayElementHighlighter from "readium_shared_js/views/media_overlay_element_highlighter";
import OnePageView from "readium_shared_js/views/one_page_view";
import ReaderView from "readium_shared_js/views/reader_view";
import ReflowableView from "readium_shared_js/views/reflowable_view";
import ScrollView from "readium_shared_js/views/scroll_view";

export default {
  Globals,
  GlobalsSetup,
  Helpers,
  PluginsController,
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
  ScrollView,
  ...Globals
};
