export type PasswordPolicyCheck = {
  id: string;
  label: string;
  passed: boolean;
  required: boolean;
};

export type PasswordPolicyResult = {
  score: number;
  passedRequired: boolean;
  checks: PasswordPolicyCheck[];
  failedRequiredLabels: string[];
};

export type PasswordPolicyContext = {
  email?: string | null;
  name?: string | null;
};

const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "password123",
  "qwerty",
  "qwerty123",
  "admin123",
  "demo12345",
  "letmein",
  "welcome",
  "welcome123",
  "vitavault",
]);

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function includesAccountIdentifier(password: string, context?: PasswordPolicyContext) {
  const normalizedPassword = normalize(password);
  const email = normalize(context?.email);
  const name = normalize(context?.name);
  const emailName = email.includes("@") ? email.split("@")[0] : email;

  const candidates = [email, emailName, name]
    .map((item) => item.trim())
    .filter((item) => item.length >= 4);

  return candidates.some((candidate) => normalizedPassword.includes(candidate));
}

export function evaluatePasswordPolicy(password: string, context?: PasswordPolicyContext): PasswordPolicyResult {
  const value = password ?? "";
  const normalized = normalize(value);

  const checks: PasswordPolicyCheck[] = [
    {
      id: "length",
      label: "At least 10 characters",
      passed: value.length >= 10,
      required: true,
    },
    {
      id: "uppercase",
      label: "At least one uppercase letter",
      passed: /[A-Z]/.test(value),
      required: true,
    },
    {
      id: "lowercase",
      label: "At least one lowercase letter",
      passed: /[a-z]/.test(value),
      required: true,
    },
    {
      id: "number",
      label: "At least one number",
      passed: /\d/.test(value),
      required: true,
    },
    {
      id: "symbol",
      label: "At least one symbol",
      passed: /[^A-Za-z0-9]/.test(value),
      required: true,
    },
    {
      id: "common",
      label: "Not a common demo/password phrase",
      passed: !COMMON_PASSWORDS.has(normalized),
      required: true,
    },
    {
      id: "account_identifier",
      label: "Does not contain your name or email handle",
      passed: !includesAccountIdentifier(value, context),
      required: true,
    },
    {
      id: "long",
      label: "14+ characters for stronger protection",
      passed: value.length >= 14,
      required: false,
    },
  ];

  const passed = checks.filter((check) => check.passed).length;
  const score = Math.round((passed / checks.length) * 100);
  const failedRequiredLabels = checks
    .filter((check) => check.required && !check.passed)
    .map((check) => check.label);

  return {
    score,
    passedRequired: failedRequiredLabels.length === 0,
    checks,
    failedRequiredLabels,
  };
}

export function assertPasswordMeetsPolicy(password: string, context?: PasswordPolicyContext) {
  const result = evaluatePasswordPolicy(password, context);

  if (!result.passedRequired) {
    throw new Error(`Password does not meet security policy: ${result.failedRequiredLabels.join(", ")}.`);
  }

  return result;
}

export const PASSWORD_POLICY_LABELS = [
  "Minimum 10 characters",
  "Uppercase and lowercase letters",
  "At least one number",
  "At least one symbol",
  "Cannot be a common password",
  "Cannot contain your email/name",
];
