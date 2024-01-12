/**
 * 
 * Note: This is no longer used as it cannot be adapt to new viewer
 * 
 * Base class for Load Detecter,
 * it is a class to detect if the next page is loaded
 * 
 * LoadDetectorBase should not bu instansiate and used directly.
 * Any subclass of LoadDetectorBase must implement a method pageLoaded(),
 * which returns a boolean value to indicate if the next page has completely loaded or not
 */
class LoadDetectorBase {
    /**
     * totalWaitTime {int} the total wait time in milliseconds
     * checkFrequency {int} the frequency of checking if the page has loaded
     * 
     * @param {Object} options stores the constructor parameters 
     */
    constructor(options) {
        this.counter = 0;
        this.running = false;
        this.isSop = false;
        this.totalWaitTime = options.totalWaitTime ? options.totalWaitTime : 10000;
        this.checkFrequency = options.checkFrequency ? options.checkFrequency : 50;
    }
}
/**
 * Start waiting for the next page if the detector has not been running.
 * 
 * @param {Object} options the parameters container
 * @return {Boolean} true if it starts successfully, false on failure
 */
LoadDetectorBase.prototype.startWaiting = function (options) {
    if (!this.running) {
        this.reset();
        this.running = true;
        this.waitForLoading(options);
        return true;
    }
    return false;
}
/**
 * @param {Object}   input : to be passed into pageLoaded function, can also contains variables to be used in the callback functions
 * @param {Function} success: function to be called upon success (the page is loaded)
 * @param {Function} check : function to be called in every checking
 * @param {Function} fail : function to be called if fail (fail if timeout)
 * 
 * @param {Object}   options the parameters container
 */
LoadDetectorBase.prototype.waitForLoading = function (options) {
    if (!this.isStop) {
        if (this.pageLoaded(options.input)) {
            if (options.success)
                options.success(options);
        } else if (this.timeExceeded()) {
            if (options.fail)
                options.fail(options);
        } else {
            if (options.check)
                options.check(options);
            this.counter += 1;
            setTimeout(() => this.waitForLoading(options), this.checkFrequency);
            return;
        }
    }
    this.reset();
}
/**
 * stop the waiting if the detector is running
 */
LoadDetectorBase.prototype.stop = function () {
    this.isStop = true;
}
/**
 * reset the detector to initial state.
 * called in every start
 */
LoadDetectorBase.prototype.reset = function () {
    this.counter = 0;
    this.running = false;
    this.isStop = false;
}
/**
 * @return {Boolean} true if timeout, false otherwise
 */
LoadDetectorBase.prototype.timeExceeded = function () {
    return this.totalWaitTime < 0 ? false : this.counter >= (this.totalWaitTime / this.checkFrequency);
}
/**
 * Implementation of Load Detector.
 * It checks if the next button in the current page is different in the previous page,
 * if yes, that means the next page is loaded
 */
class ButtonLoadDetector extends LoadDetectorBase {
    constructor(options) {
        super(options);
    }
}
/**
 * Checks if the next button in the next page is differenet than the preivous page's one.
 * 
 * @param {Object} input contains the previousBtn to be compared to
 * @return {Boolean} true if the page is loaded
 */
ButtonLoadDetector.prototype.pageLoaded = function (input) {
    const nextBtn = LocateNextBtn();
    const docName = LocateCurDocName();
    return typeof nextBtn !== "undefined" && nextBtn !== input.previousBtn && docName !== tempDocName;
}
/**
 * Implementation of Load Detecor.
 * It checks if the given's page's widgets are loaded in this page,
 * if yes, it means the page is loaded successfully
 */
class WidgetLoadDetector extends LoadDetectorBase {
    constructor(options) {
        super(options);
    }
}
/**
 * Checks if the page has loaded the given's page's widget.
 * 
 * @param {Object} input contains the nextPageName to be compared to
 * @return {Boolean} true if the page is loaded
 */
WidgetLoadDetector.prototype.pageLoaded = function (input) {
    const nextPageName = LocateCurDocName();
    return hasCompoundController() ?
        getHTMLWidget(getLastLoadedWidget(nextPageName).id) :
        getAgreementInterface().seleniumQueue.length === getPageNumberByName(nextPageName);
}
class PageChangeDetector extends LoadDetectorBase {
    constructor(options) {
        super(options);
    }
}
PageChangeDetector.prototype.pageLoaded = function (input) {
    return LocateCurDocName() !== tempDocName;
}
class PageInitialLoadDetector extends LoadDetectorBase {
    constructor(options) {
        super(options);
    }
}
PageInitialLoadDetector.prototype.pageLoaded = function (input) {
    return getCurrentTransaction() && getCurrentTransaction().$ ?
        getCurrentTransaction().$('#fieldContainer').children().length !== 0 :
        false;
}
/* Here is the variables for checking page loading */
let loadDetector = new WidgetLoadDetector({
    totalWaitTime: 10000,
    checkFrequency: 50,
});
let pageChangeDetector = new PageChangeDetector({
    totalWaitTime: 10000,
    checkFrequency: 50,
});
let pageInitialLoadDetector1 = new PageInitialLoadDetector({
    totalWaitTime: 60000,
    checkFrequency: 100,
});