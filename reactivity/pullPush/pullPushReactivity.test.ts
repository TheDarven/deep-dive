import { assertEquals } from "jsr:@std/assert";
import { computed, ReactivityTestContext, ref } from "./pullPushReactivity.ts";

import { beforeEach, describe, it } from "jsr:@std/testing/bdd";

describe("pullPushReactivity", () => {
    beforeEach(() => {
        ReactivityTestContext.isTestEnvironment = true;

        ReactivityTestContext.clearEvents();
    });

    describe("ref", () => {
        describe("given a number ref", () => {
            it("the ref should be initialized with the initial value", () => {
                const a = ref<number>(1);
                assertEquals(a.value, 1);
            });

            it("the ref should be updated with the new value", () => {
                const a = ref<number>(1);
                assertEquals(a.value, 1);

                a.value = 2;
                assertEquals(a.value, 2);
            });
        });

        describe("given a string ref", () => {
            it("the ref should be initialized with the initial value", () => {
                const a = ref<string>("1");
                assertEquals(a.value, "1");
            });

            it("the ref should be updated with the new value", () => {
                const a = ref<string>("1");
                assertEquals(a.value, "1");

                a.value = "2";
                assertEquals(a.value, "2");
            });
        });

        describe("given a boolean ref", () => {
            it("the ref should be initialized with the initial value", () => {
                const a = ref<boolean>(true);
                assertEquals(a.value, true);
            });

            it("the ref should be updated with the new value", () => {
                const a = ref<boolean>(true);
                assertEquals(a.value, true);

                a.value = false;
                assertEquals(a.value, false);
            });
        });

        it("accessing the value repeatedly should have no side effects.", () => {
            const a = ref<number>(1);
            assertEquals(a.value, 1);

            a.value;
            a.value;
            a.value;
            assertEquals(a.value, 1);
            assertEquals(a.value, 1);
            assertEquals(a.value, 1);
        });

        it("the ref should be initialized with null and updated", () => {
            const a = ref<null>(null);
            assertEquals(a.value, null);

            a.value = null;
            assertEquals(a.value, null);
        });

        it("the ref should be initialized with undefined and updated", () => {
            const a = ref<undefined>(undefined);
            assertEquals(a.value, undefined);

            a.value = undefined;
            assertEquals(a.value, undefined);
        });
    });

    describe("computed", () => {
        describe("given a computed that uses one ref value", () => {
            it("the computed value is calculated with the ref value", () => {
                const firstName = ref<string>("John");
                const formattedFirstName = computed(() =>
                    `First name is "${firstName.value}"`
                );
                assertEquals(formattedFirstName.value, 'First name is "John"');
            });

            it("computed value is invalidated when the ref value changes", () => {
                const firstName = ref<string>("John");
                const formattedFirstName = computed(() =>
                    `First name is "${firstName.value}"`
                );

                firstName.value = "Jane";
                assertEquals(formattedFirstName.value, 'First name is "Jane"');
            });

            it("for performance purposes, it's unnecessary to invalidate the computed value until it's accessed first time (i.e. the computed has not been computed yet)", () => {
                const firstName = ref<string>("John");

                const formattedFirstName = computed(
                    () => `First name is "${firstName.value}"`,
                    { name: "formattedFirstName" },
                );

                assertEquals(ReactivityTestContext.events, []);

                firstName.value = "Jane";
                assertEquals(ReactivityTestContext.events, []);

                void formattedFirstName.value;
                assertEquals(ReactivityTestContext.events, [
                    { event: "evaluate", name: "formattedFirstName" },
                ]);
            });

            it("when the computed is invalidated, the value is only re-evaluated when computed value is accessed again", () => {
                const firstName = ref<string>("John");
                const formattedFirstName = computed(
                    () => `First name is "${firstName.value}"`,
                    { name: "formattedFirstName" },
                );

                assertEquals(ReactivityTestContext.events, []); // No evaluation has been triggered yet

                void formattedFirstName.value; // Accessing the value should trigger the first evaluation
                assertEquals(ReactivityTestContext.events, [
                    { event: "evaluate", name: "formattedFirstName" },
                ]);

                firstName.value = "Jane"; // Modification of the ref value invalidates the computed value
                assertEquals(ReactivityTestContext.events, [
                    { event: "evaluate", name: "formattedFirstName" },
                    { event: "invalidateCache", name: "formattedFirstName" },
                ]);

                void formattedFirstName.value; // Accessing the value trigger the second evaluation because the computed value has been invalidated
                assertEquals(ReactivityTestContext.events, [
                    { event: "evaluate", name: "formattedFirstName" },
                    { event: "invalidateCache", name: "formattedFirstName" },
                    { event: "evaluate", name: "formattedFirstName" },
                ]);
            });

            it("computed is invalidated only once, until it's re-evaluated", () => {
                const firstName = ref<string>("John");
                const formattedFirstName = computed(
                    () => `First name is "${firstName.value}"`,
                    { name: "formattedFirstName" },
                );

                void formattedFirstName.value; // Accessing the value should trigger the first evaluation
                assertEquals(ReactivityTestContext.events, [
                    { event: "evaluate", name: "formattedFirstName" },
                ]);

                firstName.value = "Jane"; // Modification of the ref value invalidates the computed value
                assertEquals(ReactivityTestContext.events, [
                    { event: "evaluate", name: "formattedFirstName" },
                    { event: "invalidateCache", name: "formattedFirstName" },
                ]);

                firstName.value = "John"; // Modification of the ref value invalidates the computed value
                assertEquals(ReactivityTestContext.events, [
                    { event: "evaluate", name: "formattedFirstName" },
                    { event: "invalidateCache", name: "formattedFirstName" },
                ]);

                void formattedFirstName.value; // Accessing the value trigger the second evaluation because the computed value has been invalidated
                assertEquals(ReactivityTestContext.events, [
                    { event: "evaluate", name: "formattedFirstName" },
                    { event: "invalidateCache", name: "formattedFirstName" },
                    { event: "evaluate", name: "formattedFirstName" },
                ]);
            });

            it("should not notify computed if the ref value is set to the same value", () => {
                const firstName = ref<string>("John");
                const formattedFirstName = computed(
                    () => `First name is "${firstName.value}"`,
                    { name: "formattedFirstName" },
                );

                void formattedFirstName.value; // Accessing the value should trigger the first evaluation
                assertEquals(ReactivityTestContext.events, [
                    { event: "evaluate", name: "formattedFirstName" },
                ]);

                firstName.value = "John";
                // Le computed ne doit pas être réévalué
                assertEquals(ReactivityTestContext.events, [
                    { event: "evaluate", name: "formattedFirstName" },
                ]);
            });
        });

        describe("given a computed that uses multiple ref values", () => {
            it("the computed value is calculated with the ref values", () => {
                const firstName = ref<string>("John");
                const lastName = ref<string>("Doe");
                const fullName = computed(() =>
                    `${firstName.value} ${lastName.value}`
                );
                assertEquals(fullName.value, "John Doe");
            });

            it("the computed value is invalidated when one of the ref values changes", () => {
                const firstName = ref<string>("John");
                const lastName = ref<string>("Doe");
                const fullName = computed(() =>
                    `${firstName.value} ${lastName.value}`
                );

                firstName.value = "Jane";
                assertEquals(fullName.value, "Jane Doe");

                lastName.value = "Smith";
                assertEquals(fullName.value, "Jane Smith");

                firstName.value = "John";
                lastName.value = "Doe";
                assertEquals(fullName.value, "John Doe");
            });

            it("for performance purposes, it's unnecessary to invalidate the computed value until it's accessed first time (i.e. the computed has not been computed yet)", () => {
                const firstName = ref<string>("John");
                const lastName = ref<string>("Doe");
                const fullName = computed(
                    () => `${firstName.value} ${lastName.value}`,
                    { name: "fullName" },
                );

                assertEquals(ReactivityTestContext.events, []);

                firstName.value = "Jane";
                assertEquals(ReactivityTestContext.events, []);

                lastName.value = "Smith";
                assertEquals(ReactivityTestContext.events, []);

                void fullName.value;
                assertEquals(ReactivityTestContext.events, [
                    { event: "evaluate", name: "fullName" },
                ]);
            });

            it("when the computed is invalidated, the value is only re-evaluated when computed value is accessed again", () => {
                const firstName = ref<string>("John");
                const lastName = ref<string>("Doe");
                const fullName = computed(
                    () => `${firstName.value} ${lastName.value}`,
                    { name: "fullName" },
                );

                assertEquals(ReactivityTestContext.events, []); // No evaluation has been triggered yet

                void fullName.value; // Accessing the value should trigger the first evaluation
                assertEquals(ReactivityTestContext.events, [
                    { event: "evaluate", name: "fullName" },
                ]);

                firstName.value = "Jane"; // Modification of the ref value invalidates the computed value
                lastName.value = "Smith";
                assertEquals(ReactivityTestContext.events, [
                    { event: "evaluate", name: "fullName" },
                    { event: "invalidateCache", name: "fullName" },
                ]);

                void fullName.value; // Accessing the value trigger the second evaluation because the computed value has been invalidated
                assertEquals(ReactivityTestContext.events, [
                    { event: "evaluate", name: "fullName" },
                    { event: "invalidateCache", name: "fullName" },
                    { event: "evaluate", name: "fullName" },
                ]);
            });

            it("computed is invalidated only once, until it's re-evaluated", () => {
                const firstName = ref<string>("John");
                const lastName = ref<string>("Doe");
                const fullName = computed(
                    () => `${firstName.value} ${lastName.value}`,
                    { name: "fullName" },
                );

                assertEquals(ReactivityTestContext.events, []); // No evaluation has been triggered yet

                void fullName.value; // Accessing the value should trigger the first evaluation
                assertEquals(ReactivityTestContext.events, [
                    { event: "evaluate", name: "fullName" },
                ]);

                firstName.value = "Jane"; // Modification of the ref value invalidates the computed value
                assertEquals(ReactivityTestContext.events, [
                    { event: "evaluate", name: "fullName" },
                    { event: "invalidateCache", name: "fullName" },
                ]);

                lastName.value = "Smith"; // 👉 Computed is already invalidated, no need to invalidate it again
                assertEquals(ReactivityTestContext.events, [
                    { event: "evaluate", name: "fullName" },
                    { event: "invalidateCache", name: "fullName" },
                ]);

                void fullName.value; // Accessing the value trigger the second evaluation because the computed value has been invalidated
                assertEquals(ReactivityTestContext.events, [
                    { event: "evaluate", name: "fullName" },
                    { event: "invalidateCache", name: "fullName" },
                    { event: "evaluate", name: "fullName" },
                ]);
            });
        });

        describe("given a computed that uses one dependency computed value", () => {
            it("the computed value is calculated with the dependency computed value", () => {
                const firstName = ref<string>("John");
                const lastName = ref<string>("Doe");
                const fullName = computed(() =>
                    `${firstName.value} ${lastName.value}`
                );

                const formattedFullName = computed(() =>
                    `Full name is "${fullName.value}"`
                );
                assertEquals(
                    formattedFullName.value,
                    'Full name is "John Doe"',
                );
            });

            it("the computed value is invalidated when the dependency computed value changes", () => {
                const firstName = ref<string>("John");
                const lastName = ref<string>("Doe");
                const fullName = computed(() =>
                    `${firstName.value} ${lastName.value}`
                );

                const formattedFullName = computed(() =>
                    `Full name is "${fullName.value}"`
                );

                firstName.value = "Jane";
                assertEquals(
                    formattedFullName.value,
                    'Full name is "Jane Doe"',
                );

                lastName.value = "Smith";
                assertEquals(
                    formattedFullName.value,
                    'Full name is "Jane Smith"',
                );
            });

            describe("for performance purposes, it's unnecessary to invalidate the computed value until it's accessed first time (i.e. the computed has not been computed yet)", () => {
                it("dependency computed value is evaluated first to evaluate the computed value", () => {
                    const firstName = ref<string>("John");
                    const lastName = ref<string>("Doe");
                    const fullName = computed(
                        () => `${firstName.value} ${lastName.value}`,
                        { name: "fullName" },
                    );
                    const formattedFullName = computed(
                        () => `Full name is "${fullName.value}"`,
                        { name: "formattedFullName" },
                    );

                    assertEquals(ReactivityTestContext.events, []);

                    firstName.value = "Jane";
                    assertEquals(ReactivityTestContext.events, []);

                    lastName.value = "Smith";
                    assertEquals(ReactivityTestContext.events, []);

                    void formattedFullName.value;
                    assertEquals(ReactivityTestContext.events, [
                        { event: "evaluate", name: "formattedFullName" },
                        { event: "evaluate", name: "fullName" },
                    ]);
                });
            });

            it("when the computed is invalidated, the value is only re-evaluated when computed value is accessed again", () => {
                const firstName = ref<string>("John");
                const lastName = ref<string>("Doe");
                const fullName = computed(
                    () => `${firstName.value} ${lastName.value}`,
                    { name: "fullName" },
                );
                const formattedFullName = computed(
                    () => `Full name is "${fullName.value}"`,
                    { name: "formattedFullName" },
                );

                assertEquals(ReactivityTestContext.events, []); // No evaluation has been triggered yet

                void formattedFullName.value; // Accessing the value should trigger the first evaluation
                assertEquals(ReactivityTestContext.events, [
                    { event: "evaluate", name: "formattedFullName" },
                    { event: "evaluate", name: "fullName" },
                ]);

                firstName.value = "Jane"; // Modification of the ref value invalidates the computed values
                assertEquals(ReactivityTestContext.events, [
                    { event: "evaluate", name: "formattedFullName" },
                    { event: "evaluate", name: "fullName" },
                    { event: "invalidateCache", name: "fullName" },
                    { event: "invalidateCache", name: "formattedFullName" },
                ]);

                void formattedFullName.value; // Accessing the value trigger the second evaluation because the computed value has been invalidated
                assertEquals(ReactivityTestContext.events, [
                    { event: "evaluate", name: "formattedFullName" },
                    { event: "evaluate", name: "fullName" },
                    { event: "invalidateCache", name: "fullName" },
                    { event: "invalidateCache", name: "formattedFullName" },
                    { event: "evaluate", name: "formattedFullName" },
                    { event: "evaluate", name: "fullName" },
                ]);
            });

            it("computed is invalidated only once, until it's re-evaluated", () => {
                const firstName = ref<string>("John");
                const lastName = ref<string>("Doe");
                const fullName = computed(
                    () => `${firstName.value} ${lastName.value}`,
                    { name: "fullName" },
                );
                const formattedFullName = computed(
                    () => `Full name is "${fullName.value}"`,
                    { name: "formattedFullName" },
                );

                void formattedFullName.value; // Accessing the value should trigger the first evaluation

                firstName.value = "Jane"; // Modification of the ref value invalidates the computed values
                assertEquals(ReactivityTestContext.events, [
                    { event: "evaluate", name: "formattedFullName" },
                    { event: "evaluate", name: "fullName" },
                    { event: "invalidateCache", name: "fullName" },
                    { event: "invalidateCache", name: "formattedFullName" },
                ]);

                lastName.value = "Smith"; // 👉 Computed is already invalidated, no need to invalidate it again
                assertEquals(ReactivityTestContext.events, [
                    { event: "evaluate", name: "formattedFullName" },
                    { event: "evaluate", name: "fullName" },
                    { event: "invalidateCache", name: "fullName" },
                    { event: "invalidateCache", name: "formattedFullName" },
                ]);
            });

            it.only("should not notify computed if the dependency computed value is re-evaluated to the same value", () => {
                const number1 = ref<number>(1);
                const number2 = ref<number>(2);
                const minNumber = computed(
                    () => Math.min(number1.value, number2.value),
                    { name: "minNumber" },
                );
                const formattedMinNumber = computed(
                    () => `Min number is "${minNumber.value}"`,
                    { name: "formattedMinNumber" },
                );

                void formattedMinNumber.value;
                assertEquals(ReactivityTestContext.events, [
                    { event: "evaluate", name: "formattedMinNumber" },
                    { event: "evaluate", name: "minNumber" },
                ]);

                number1.value = 3;
                number2.value = 1;
                assertEquals(ReactivityTestContext.events, [
                    { event: "evaluate", name: "formattedMinNumber" },
                    { event: "evaluate", name: "minNumber" },
                    { event: "invalidateCache", name: "minNumber" },
                ]);
            });
        });

        describe("given a computed that uses multiple ref values and computed values", () => {
            it("the computed value is calculated with the ref values and computed values", () => {
                const firstName = ref<string>("John");
                const lastName = ref<string>("Doe");
                const fullName = computed(() =>
                    `${firstName.value} ${lastName.value}`
                );

                const age = ref<number>(30);

                const identity = computed(() =>
                    `${fullName.value} is ${age.value} years old`
                );
                assertEquals(identity.value, "John Doe is 30 years old");
            });

            it("the computed value is invalidated when the dependency computed value or ref value changes", () => {
                const firstName = ref<string>("John");
                const lastName = ref<string>("Doe");
                const fullName = computed(() =>
                    `${firstName.value} ${lastName.value}`
                );

                const age = ref<number>(30);

                const identity = computed(() =>
                    `${fullName.value} is ${age.value} years old`
                );

                firstName.value = "Jane";
                assertEquals(identity.value, "Jane Doe is 30 years old");

                age.value = 31;
                assertEquals(identity.value, "Jane Doe is 31 years old");

                lastName.value = "Smith";
                assertEquals(identity.value, "Jane Smith is 31 years old");

                firstName.value = "John";
                lastName.value = "Doe";
                assertEquals(identity.value, "John Doe is 31 years old");
            });

            // ======== //
            // ======== //
            // ======== //
            // ======== //
            // ======== //

            it("for performance purposes, it's unnecessary to invalidate the computed value until it's accessed first time (i.e. the computed has not been computed yet)", () => {
                const firstName = ref<string>("John");
                const lastName = ref<string>("Doe");
                const fullName = computed(
                    () => `${firstName.value} ${lastName.value}`,
                    { name: "fullName" },
                );
                const age = ref<number>(30);
                const identity = computed(
                    () => `${fullName.value} is ${age.value} years old`,
                    { name: "identity" },
                );

                assertEquals(ReactivityTestContext.events, []);

                firstName.value = "Jane";
                assertEquals(ReactivityTestContext.events, []);

                lastName.value = "Smith";
                assertEquals(ReactivityTestContext.events, []);

                identity.value;
                assertEquals(ReactivityTestContext.events, [
                    { event: "evaluate", name: "identity" },
                    { event: "evaluate", name: "fullName" },
                ]);
            });

            it("when the computed is invalidated, the value is only re-evaluated when computed value is accessed again", () => {
                const firstName = ref<string>("John");
                const lastName = ref<string>("Doe");
                const fullName = computed(
                    () => `${firstName.value} ${lastName.value}`,
                    { name: "fullName" },
                );
                const age = ref<number>(30);
                const identity = computed(
                    () => `${fullName.value} is ${age.value} years old`,
                    { name: "identity" },
                );

                assertEquals(ReactivityTestContext.events, []); // No evaluation has been triggered yet

                void identity.value; // Accessing the value should trigger the first evaluation
                assertEquals(ReactivityTestContext.events, [
                    { event: "evaluate", name: "identity" },
                    { event: "evaluate", name: "fullName" },
                ]);

                firstName.value = "Jane"; // Modification of the ref value invalidates the computed values
                assertEquals(ReactivityTestContext.events, [
                    { event: "evaluate", name: "identity" },
                    { event: "evaluate", name: "fullName" },
                    { event: "invalidateCache", name: "fullName" },
                    { event: "invalidateCache", name: "identity" },
                ]);

                void identity.value; // Accessing the value trigger the second evaluation because the computed value has been invalidated
                assertEquals(ReactivityTestContext.events, [
                    { event: "evaluate", name: "identity" },
                    { event: "evaluate", name: "fullName" },
                    { event: "invalidateCache", name: "fullName" },
                    { event: "invalidateCache", name: "identity" },
                    { event: "evaluate", name: "identity" },
                    { event: "evaluate", name: "fullName" },
                ]);
            });

            it("computed is invalidated only once, until it's re-evaluated", () => {
                const firstName = ref<string>("John");
                const lastName = ref<string>("Doe");
                const fullName = computed(
                    () => `${firstName.value} ${lastName.value}`,
                    { name: "fullName" },
                );
                const age = ref<number>(30);
                const identity = computed(
                    () => `${fullName.value} is ${age.value} years old`,
                    { name: "identity" },
                );

                void identity.value; // Accessing the value should trigger the first evaluation

                firstName.value = "Jane"; // Modification of the ref value invalidates the computed values
                assertEquals(ReactivityTestContext.events, [
                    { event: "evaluate", name: "identity" },
                    { event: "evaluate", name: "fullName" },
                    { event: "invalidateCache", name: "fullName" },
                    { event: "invalidateCache", name: "identity" },
                ]);

                lastName.value = "Smith"; // 👉 Computed is already invalidated, no need to invalidate it again
                assertEquals(ReactivityTestContext.events, [
                    { event: "evaluate", name: "identity" },
                    { event: "evaluate", name: "fullName" },
                    { event: "invalidateCache", name: "fullName" },
                    { event: "invalidateCache", name: "identity" },
                ]);
            });
        });
    });
});
