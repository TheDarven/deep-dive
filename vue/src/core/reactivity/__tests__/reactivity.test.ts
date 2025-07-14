import { describe, expect, it } from "vitest";
import { computed, ref } from "../src";

describe("reactivity", () => {
  describe("ref", () => {
    describe("given a number ref", () => {
      it("initializes with the provided number", () => {
        const a = ref<number>(1);
        expect(a.value).toBe(1);
      });

      it("updates the value when a new number is assigned", () => {
        const a = ref<number>(1);
        expect(a.value).toBe(1);

        a.value = 2;
        expect(a.value).toBe(2);
      });
    });

    describe("given a string ref", () => {
      it("initializes with the provided string", () => {
        const a = ref<string>("1");
        expect(a.value).toBe("1");
      });

      it("updates the value when a new string is assigned", () => {
        const a = ref<string>("1");
        expect(a.value).toBe("1");

        a.value = "2";
        expect(a.value).toBe("2");
      });
    });

    describe("given a boolean ref", () => {
      it("initializes with the provided boolean", () => {
        const a = ref<boolean>(true);
        expect(a.value).toBe(true);
      });

      it("updates the value when a new boolean is assigned", () => {
        const a = ref<boolean>(true);
        expect(a.value).toBe(true);

        a.value = false;
        expect(a.value).toBe(false);
      });
    });

    it("repeated access to .value does not trigger side effects", () => {
      const a = ref<number>(1);
      expect(a.value).toBe(1);

      a.value;
      a.value;
      a.value;
      expect(a.value).toBe(1);
      expect(a.value).toBe(1);
      expect(a.value).toBe(1);
    });

    it("initializes with null and updates correctly", () => {
      const a = ref<null>(null);
      expect(a.value).toBe(null);

      a.value = null;
      expect(a.value).toBe(null);
    });

    it("initializes with undefined and updates correctly", () => {
      const a = ref<undefined>(undefined);
      expect(a.value).toBe(undefined);

      a.value = undefined;
      expect(a.value).toBe(undefined);
    });
  });

  describe("computed", () => {
    describe("given a computed that uses one ref value", () => {
      it("the computed value is calculated with the ref value", () => {
        const firstName = ref<string>("John");
        const formattedFirstName = computed(() =>
          `First name is "${firstName.value}"`
        );
        expect(formattedFirstName.value).toBe('First name is "John"');
      });

      it("computed value is invalidated when the ref value changes", () => {
        const firstName = ref<string>("John");
        const formattedFirstName = computed(() =>
          `First name is "${firstName.value}"`
        );

        firstName.value = "Jane";
        expect(formattedFirstName.value).toBe('First name is "Jane"');
      });

      /* it("for performance purposes, it's unnecessary to invalidate the computed value until it's accessed first time (i.e. the computed has not been computed yet)", () => {
        const firstName = ref<string>("John");

        const formattedFirstName = computed(
          () => `First name is "${firstName.value}"`,
          { name: "formattedFirstName" },
        );

        expect(ReactivityTestContext.events).to.deep.equal([]);

        firstName.value = "Jane";
        expect(ReactivityTestContext.events).to.deep.equal([]);

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
          { event: "markedAsDirty", name: "formattedFirstName" },
        ]);

        void formattedFirstName.value; // Accessing the value trigger the second evaluation because the computed value has been invalidated
        assertEquals(ReactivityTestContext.events, [
          { event: "evaluate", name: "formattedFirstName" },
          { event: "markedAsDirty", name: "formattedFirstName" },
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
          { event: "markedAsDirty", name: "formattedFirstName" },
        ]);

        firstName.value = "John"; // Modification of the ref value invalidates the computed value
        assertEquals(ReactivityTestContext.events, [
          { event: "evaluate", name: "formattedFirstName" },
          { event: "markedAsDirty", name: "formattedFirstName" },
        ]);

        void formattedFirstName.value; // Accessing the value trigger the second evaluation because the computed value has been invalidated
        assertEquals(ReactivityTestContext.events, [
          { event: "evaluate", name: "formattedFirstName" },
          { event: "markedAsDirty", name: "formattedFirstName" },
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
          { event: "markedAsDirty", name: "fullName" },
        ]);

        void fullName.value; // Accessing the value trigger the second evaluation because the computed value has been invalidated
        assertEquals(ReactivityTestContext.events, [
          { event: "evaluate", name: "fullName" },
          { event: "markedAsDirty", name: "fullName" },
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
          { event: "markedAsDirty", name: "fullName" },
        ]);

        lastName.value = "Smith"; // 👉 Computed is already invalidated, no need to invalidate it again
        assertEquals(ReactivityTestContext.events, [
          { event: "evaluate", name: "fullName" },
          { event: "markedAsDirty", name: "fullName" },
        ]);

        void fullName.value; // Accessing the value trigger the second evaluation because the computed value has been invalidated
        assertEquals(ReactivityTestContext.events, [
          { event: "evaluate", name: "fullName" },
          { event: "markedAsDirty", name: "fullName" },
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
          { event: "markedAsDirty", name: "fullName" },
          { event: "markedAsDirty", name: "formattedFullName" },
        ]);

        void formattedFullName.value; // Accessing the value trigger the second evaluation because the computed value has been invalidated
        assertEquals(ReactivityTestContext.events, [
          { event: "evaluate", name: "formattedFullName" },
          { event: "evaluate", name: "fullName" },
          { event: "markedAsDirty", name: "fullName" },
          { event: "markedAsDirty", name: "formattedFullName" },
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
          { event: "markedAsDirty", name: "fullName" },
          { event: "markedAsDirty", name: "formattedFullName" },
        ]);

        lastName.value = "Smith"; // 👉 Computed is already invalidated, no need to invalidate it again
        assertEquals(ReactivityTestContext.events, [
          { event: "evaluate", name: "formattedFullName" },
          { event: "evaluate", name: "fullName" },
          { event: "markedAsDirty", name: "fullName" },
          { event: "markedAsDirty", name: "formattedFullName" },
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
          { event: "markedAsDirty", name: "fullName" },
          { event: "markedAsDirty", name: "identity" },
        ]);

        void identity.value; // Accessing the value trigger the second evaluation because the computed value has been invalidated
        assertEquals(ReactivityTestContext.events, [
          { event: "evaluate", name: "identity" },
          { event: "evaluate", name: "fullName" },
          { event: "markedAsDirty", name: "fullName" },
          { event: "markedAsDirty", name: "identity" },
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
          { event: "markedAsDirty", name: "fullName" },
          { event: "markedAsDirty", name: "identity" },
        ]);

        lastName.value = "Smith"; // 👉 Computed is already invalidated, no need to invalidate it again
        assertEquals(ReactivityTestContext.events, [
          { event: "evaluate", name: "identity" },
          { event: "evaluate", name: "fullName" },
          { event: "markedAsDirty", name: "fullName" },
          { event: "markedAsDirty", name: "identity" },
        ]);
      });
    });

    it("updates all computed subscribers when a dependency changes", () => {
      const firstName = ref<string>("John");
      const lastName = ref<string>("Doe");
      const fullName = computed(() =>
        `${firstName.value} ${lastName.value}`
      );

      const age = ref<number>(30);

      const lightIdentity = computed(() =>
        `${fullName.value} (${age.value} yo)`
      );

      const fullIdentity = computed(() =>
        `${fullName.value} is ${age.value} years old`
      );

      assertEquals(lightIdentity.value, "John Doe (30 yo)");
      assertEquals(fullIdentity.value, "John Doe is 30 years old");

      firstName.value = "Jane";
      assertEquals(lightIdentity.value, "Jane Doe (30 yo)");
      assertEquals(fullIdentity.value, "Jane Doe is 30 years old");
    });  */
    });
  });
});
