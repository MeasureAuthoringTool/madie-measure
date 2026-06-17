"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var react_1 = require("@testing-library/react");
var user_event_1 = require("@testing-library/user-event");
var HowItWorks_1 = require("./HowItWorks");
describe("HowItWorks", function () {
    it("renders the 'How it works' link by default", function () {
        (0, react_1.render)(<HowItWorks_1.default />);
        var link = react_1.screen.getByTestId("how-it-works-link");
        expect(link).toBeInTheDocument();
        expect(link).toHaveTextContent("How it works");
        expect(react_1.screen.queryByTestId("how-it-works-content")).not.toBeInTheDocument();
    });
    it("opens the info section when the link is clicked", function () { return __awaiter(void 0, void 0, void 0, function () {
        var link, content;
        return __generator(this, function (_a) {
            (0, react_1.render)(<HowItWorks_1.default />);
            link = react_1.screen.getByTestId("how-it-works-link");
            user_event_1.default.click(link);
            content = react_1.screen.getByTestId("how-it-works-content");
            expect(content).toBeInTheDocument();
            expect(react_1.screen.getByText("How it Works")).toBeInTheDocument();
            expect(react_1.screen.getByText(/To complete this process:/)).toBeInTheDocument();
            return [2 /*return*/];
        });
    }); });
    it("displays steps including the nested view-test-case guidance", function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            (0, react_1.render)(<HowItWorks_1.default />);
            user_event_1.default.click(react_1.screen.getByTestId("how-it-works-link"));
            expect(react_1.screen.getByText("Select the measure that contains the test case you want to insert.")).toBeInTheDocument();
            expect(react_1.screen.getByText("Select the test case you want to insert profiles from.")).toBeInTheDocument();
            expect(react_1.screen.getByText("You can select View Test Case to review details before proceeding.")).toBeInTheDocument();
            expect(react_1.screen.getByText("Select Insert.")).toBeInTheDocument();
            return [2 /*return*/];
        });
    }); });
    it("closes the info section when the X button is clicked", function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            (0, react_1.render)(<HowItWorks_1.default />);
            user_event_1.default.click(react_1.screen.getByTestId("how-it-works-link"));
            expect(react_1.screen.getByTestId("how-it-works-content")).toBeInTheDocument();
            user_event_1.default.click(react_1.screen.getByTestId("how-it-works-close"));
            expect(react_1.screen.queryByTestId("how-it-works-content")).not.toBeInTheDocument();
            expect(react_1.screen.getByTestId("how-it-works-link")).toBeInTheDocument();
            return [2 /*return*/];
        });
    }); });
    it("sets aria-expanded correctly on the link", function () {
        (0, react_1.render)(<HowItWorks_1.default />);
        var link = react_1.screen.getByTestId("how-it-works-link");
        expect(link).toHaveAttribute("aria-expanded", "false");
    });
    // --- Controlled mode ---
    describe("controlled mode", function () {
        it("respects an external isOpen=true prop without internal state", function () {
            (0, react_1.render)(<HowItWorks_1.default isOpen={true}/>);
            expect(react_1.screen.getByTestId("how-it-works-content")).toBeInTheDocument();
            expect(react_1.screen.queryByTestId("how-it-works-link")).not.toBeInTheDocument();
        });
        it("respects an external isOpen=false prop", function () {
            (0, react_1.render)(<HowItWorks_1.default isOpen={false}/>);
            expect(react_1.screen.getByTestId("how-it-works-link")).toBeInTheDocument();
            expect(react_1.screen.queryByTestId("how-it-works-content")).not.toBeInTheDocument();
        });
        it("invokes onOpenChange(true) when link is clicked in controlled mode", function () { return __awaiter(void 0, void 0, void 0, function () {
            var onOpenChange;
            return __generator(this, function (_a) {
                onOpenChange = jest.fn();
                (0, react_1.render)(<HowItWorks_1.default isOpen={false} onOpenChange={onOpenChange}/>);
                user_event_1.default.click(react_1.screen.getByTestId("how-it-works-link"));
                expect(onOpenChange).toHaveBeenCalledWith(true);
                return [2 /*return*/];
            });
        }); });
        it("invokes onOpenChange(false) when close button is clicked in controlled mode", function () { return __awaiter(void 0, void 0, void 0, function () {
            var onOpenChange;
            return __generator(this, function (_a) {
                onOpenChange = jest.fn();
                (0, react_1.render)(<HowItWorks_1.default isOpen={true} onOpenChange={onOpenChange}/>);
                user_event_1.default.click(react_1.screen.getByTestId("how-it-works-close"));
                expect(onOpenChange).toHaveBeenCalledWith(false);
                return [2 /*return*/];
            });
        }); });
        it("does not toggle internally when controlled (parent must update isOpen)", function () { return __awaiter(void 0, void 0, void 0, function () {
            var onOpenChange;
            return __generator(this, function (_a) {
                onOpenChange = jest.fn();
                (0, react_1.render)(<HowItWorks_1.default isOpen={false} onOpenChange={onOpenChange}/>);
                user_event_1.default.click(react_1.screen.getByTestId("how-it-works-link"));
                expect(onOpenChange).toHaveBeenCalledWith(true);
                // still closed because parent did not flip isOpen
                expect(react_1.screen.queryByTestId("how-it-works-content")).not.toBeInTheDocument();
                return [2 /*return*/];
            });
        }); });
        it("calls onOpenChange in uncontrolled mode as well (when provided)", function () { return __awaiter(void 0, void 0, void 0, function () {
            var onOpenChange;
            return __generator(this, function (_a) {
                onOpenChange = jest.fn();
                (0, react_1.render)(<HowItWorks_1.default onOpenChange={onOpenChange}/>);
                user_event_1.default.click(react_1.screen.getByTestId("how-it-works-link"));
                expect(onOpenChange).toHaveBeenCalledWith(true);
                // uncontrolled: state did flip
                expect(react_1.screen.getByTestId("how-it-works-content")).toBeInTheDocument();
                return [2 /*return*/];
            });
        }); });
    });
});
